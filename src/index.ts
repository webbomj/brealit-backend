import express, { json } from 'express'
import { createSeed } from './lib/seed'
import { AppContext, createAppContext } from './lib/ctx'
import cors from 'cors'
import { getENV } from './lib/env'
import { applyPassportToExpressApp } from './lib/passport'
import { signJWT } from './utils/signJWT'

const env = getENV()

void (async () => {
  let ctx: AppContext | null
  try {
    ctx = createAppContext()
    if (!ctx) {
      throw Error('Context doesnt create')
    }

    await createSeed(ctx.prisma)
    const expressApp = express()
    expressApp.use(cors())
    applyPassportToExpressApp(expressApp, ctx)
    expressApp.use(json())

    //get all reception days
    expressApp.get('/reception-days', async (req, res, next) => {
      try {
        if (!req.user) {
          throw Error('UNAUTHORIZED')
        }

        const receptionDays = await ctx?.prisma.receptionDay.findMany()

        res.status(200).send(receptionDays)
      } catch (e) {
        next(e)
      }
    })

    //login
    expressApp.get('/login', async (req, res, next) => {
      try {
        const login = req.body?.login
        const password = req.body?.password

        if (!login || !password) {
          res.status(400).send('Login and password required')
        }

        const user = await ctx?.prisma.patient.findUnique({
          where: {
            login: login,
            password: password,
          },
        })

        if (!user) {
          throw Error('User doesnt exist')
        }

        const token = signJWT(user.id)

        res.status(200).send({
          token: token,
        })
      } catch (e) {
        next(e)
      }
    })

    //get pacient
    expressApp.get('/pacient/', async (req, res, next) => {
      try {
        const pacientId = Number(req.body.pacientId)
        const user = await ctx?.prisma.patient.findUnique({
          where: {
            id: pacientId,
          },
          include: {
            patienReceptionDay: {
              where: {
                patientId: pacientId,
              },
              select: {
                receptionDay: true,
              },
            },
          },
        })

        if (!user) {
          res.status(200).send()
        }

        res.status(200).send(user)
      } catch (e) {
        next(e)
      }
    })

    //appointment-pacient

    expressApp.get('/appointment-pacient/', async (req, res, next) => {
      try {
        const patientId = Number(req.body.pacientId)
        const receptionDayId = Number(req.body.receptionDayId)

        const receptionDay = await ctx?.prisma.receptionDay.findUnique({
          where: {
            id: receptionDayId,
          },
        })

        if (!receptionDay) {
          throw Error('Day doesnt exist')
        }

        if (receptionDay?.numberOfPatients <= 0) {
          throw Error('There are no available seats')
        }

        const patientReceptionDay = await ctx?.prisma.patientReceptionDay.findFirst({
          where: {
            patientId: patientId,
            receptionDayId: receptionDayId,
          },
        })

        if (patientReceptionDay?.patientId) {
          await ctx?.prisma.patientReceptionDay.delete({
            where: {
              receptionDayId_patientId: {
                patientId: patientId,
                receptionDayId: receptionDayId,
              },
              patientId: patientId,
              receptionDayId: receptionDayId,
            },
          })

          await ctx?.prisma.receptionDay.update({
            where: {
              id: receptionDayId,
            },
            data: {
              numberOfPatients: {
                increment: 1,
              },
            },
          })
          console.log('Deleted')
        } else {
          await ctx?.prisma.patientReceptionDay.create({
            data: {
              patientId: patientId,
              receptionDayId: receptionDayId,
            },
          })

          await ctx?.prisma.receptionDay.update({
            where: {
              id: receptionDayId,
            },
            data: {
              numberOfPatients: {
                decrement: 1,
              },
            },
          })
          console.log('Created')
        }

        res.status(200).send('Created')
      } catch (e) {
        next(e)
      }
    })

    expressApp.listen(env.PORT, () => {
      console.info('Listening at http://localhost:3000')
    })
  } catch (e: any) {
    console.error(e.message)
  }
})()
