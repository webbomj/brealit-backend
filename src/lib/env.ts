export const getENV = () => {
  const env = process.env
  if (!env) {
    throw Error('ENV REQUIRED')
  }

  const envVar = ['DATABASE_URL', 'JWT_SECRET', 'PORT']
  const keys = Object.keys(env)

  envVar.forEach((varr) => {
    if (!keys.includes(varr)) {
      throw Error(`${varr} - IN ENV REQUIRED`)
    }
  })

  envVar.forEach((varr) => {
    if (!env[varr]) {
      throw Error(`${varr} - IN ENV REQUIRED`)
    }
  })

  return env
}

export const env = getENV()
