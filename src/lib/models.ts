import { Patient } from '@prisma/client'

export const toClientMe = (patient: Patient | undefined) => {
  return (
    patient && {
      id: patient.id,
      login: patient.login,
    }
  )
}
