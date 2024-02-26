import { Patient } from '@prisma/client'
import cors from 'cors'
import express, { json } from 'express'
import { createSeed } from './lib/seed'
import { AppContext, createAppContext } from './lib/ctx'
import { getENV } from './lib/env'
import { applyPassportToExpressApp } from './lib/passport'
import { toClientMe } from './lib/models'
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
    expressApp.use(json())
    expressApp.use(cors())
    applyPassportToExpressApp(expressApp, ctx)

    //get Me
    expressApp.get('/get-me', (req, res) => {
      res.send({ success: !!req.user ?? false, me: toClientMe(req.user as Patient) })
    })

    expressApp.get('/doctor', async (req, res, next) => {
      try {
        if (!req.user) {
          throw Error('UNAUTHORIZED')
        }

        const doctor = await ctx?.prisma.doctor.findFirst({
          select: {
            id: true,
            description: true,
            name: true,
          },
        })

        res.status(200).send(doctor)
      } catch (e) {
        next(e)
      }
    })

    //login
    expressApp.post('/login', async (req, res, next) => {
      try {
        const login = req.body?.login
        const password = req.body?.password

        if (!login || !password) {
          res.status(400).send({ error: 'Login and password required' })
        }

        const user = await ctx?.prisma.patient.findUnique({
          where: {
            login: login,
            password: password,
          },
        })

        if (!user) {
          res.status(400).send({ error: 'User doesnt exist' })
        }

        const token = signJWT(user?.id ?? 0)

        res.status(200).send({
          token: token,
        })
      } catch (e) {
        next(e)
      }
    })

    //get all reception days
    expressApp.get('/reception-days', async (req, res, next) => {
      try {
        if (!req.user) {
          throw Error('UNAUTHORIZED')
        }

        const receptionDays = await ctx?.prisma.receptionDay.findMany({
          orderBy: {
            date: 'asc',
          },
        })

        res.status(200).send(receptionDays)
      } catch (e) {
        next(e)
      }
    })

    //get pacient
    expressApp.get('/patient/', async (req, res, next) => {
      try {
        if (!req.user) {
          throw Error('UNAUTHORIZED')
        }

        const reqUser = req.user as Patient
        const user = await ctx?.prisma.patient.findUnique({
          where: {
            login: reqUser.login,
          },
          include: {
            patienReceptionDay: {
              where: {
                patientId: reqUser.id,
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

    expressApp.post('/appointment-patient/', async (req, res, next) => {
      try {
        if (!req.user) {
          throw Error('UNAUTHORIZED')
        }

        const reqUser = req.user as Patient
        // const patientId = Number(req.body.pacientId)
        const receptionDayId = Number(req.body.receptionDayId)

        const receptionDay = await ctx?.prisma.receptionDay.findUnique({
          where: {
            id: receptionDayId,
          },
        })

        if (!receptionDay) {
          throw Error('Day doesnt exist')
        }

        const patientReceptionDay = await ctx?.prisma.patientReceptionDay.findFirst({
          where: {
            patientId: reqUser.id,
            receptionDayId: receptionDayId,
          },
        })

        if (patientReceptionDay?.patientId) {
          await ctx?.prisma.patientReceptionDay.delete({
            where: {
              receptionDayId_patientId: {
                patientId: reqUser.id,
                receptionDayId: receptionDayId,
              },
              patientId: reqUser.id,
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
          if (receptionDay?.numberOfPatients <= 0) {
            throw Error('There are no available seats')
          }
          await ctx?.prisma.patientReceptionDay.create({
            data: {
              patientId: reqUser.id,
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

        res.status(200).send({
          error: '',
          success: true,
        })
      } catch (e: any) {
        res.status(200).send({
          error: e.message,
        })
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
