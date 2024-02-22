import { type Express } from 'express'
import { Passport } from 'passport'
import { ExtractJwt, Strategy as JWTStrategy } from 'passport-jwt'
import { type AppContext } from './ctx'
import { env } from './env'

export const applyPassportToExpressApp = (expressApp: Express, ctx: AppContext): void => {
  const passport = new Passport()

  passport.use(
    new JWTStrategy(
      {
        secretOrKey: env.JWT_SECRET || '',
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
      },
      (jwtPayload: string, done) => {
        ctx.prisma.patient
          .findUnique({
            where: { id: Number(jwtPayload) },
          })
          .then((user) => {
            if (!user) {
              done(null, false)
              return
            }
            done(null, user)
          })
          .catch((error) => {
            done(error, false)
          })
      }
    )
  )

  expressApp.use((req, res, next) => {
    if (!req.headers.authorization) {
      next()
      return
    }
    passport.authenticate('jwt', { session: false }, (...args: any[]) => {
      req.user = args[1] || undefined
      next()
    })(req, res, next)
  })
}
