import { PrismaClient } from '@prisma/client'

const patients = [
  { login: 'patient1', password: '1' },
  { login: 'patient2', password: '2' },
  { login: 'patient3', password: '3' },
  { login: 'patient4', password: '4' },
]

const days = [
  { date: new Date('2024-02-26'), numberOfPatients: 3 },
  { date: new Date('2024-02-27'), numberOfPatients: 1 },
  { date: new Date('2024-02-29'), numberOfPatients: 2 },
  { date: new Date('2024-03-06'), numberOfPatients: 4 },
]

export const createSeed = async (prisma: PrismaClient) => {
  //create the Doctor
  const doctor = await prisma.doctor.upsert({
    create: {
      description: 'Уколов хватит на всех',
      name: 'Антон',
      secondName: 'Белозварецковскологный',
      id: 1,
    },
    update: {},
    where: {
      id: 1,
    },
  })

  //create a receptionDays
  const newReceptionDay = days.map(async (day, i) => {
    return await prisma.receptionDay.upsert({
      create: {
        ...day,
        doctorId: doctor.id,
      },
      update: {},
      where: {
        date: day.date,
      },
    })
  })

  await Promise.all(newReceptionDay)

  //create a patient
  const newPatients = patients.map(async (patient) => {
    return await prisma.patient.upsert({
      create: {
        login: patient.login,
        password: patient.password,
      },
      update: {},
      where: {
        login: patient.login,
      },
    })
  })

  await Promise.all(newPatients)
}
