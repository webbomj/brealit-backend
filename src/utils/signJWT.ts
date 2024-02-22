import jwt from 'jsonwebtoken'

const env = process.env

export const signJWT = (userId: number): string => {
  return jwt.sign(`${userId}`, env?.JWT_SECRET ?? '')
}
