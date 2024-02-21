import express from 'express'

const expressApp = express()

expressApp.listen(3000, () => {
  console.info('Listening at http://localhost:3000')
})
