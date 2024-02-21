-- CreateTable
CREATE TABLE "Doctor" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "secondName" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionDay" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "numberOfPatients" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,

    CONSTRAINT "ReceptionDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientReceptionDay" (
    "receptionDayId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionDay_date_key" ON "ReceptionDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_login_key" ON "Patient"("login");

-- CreateIndex
CREATE UNIQUE INDEX "PatientReceptionDay_receptionDayId_patientId_key" ON "PatientReceptionDay"("receptionDayId", "patientId");

-- AddForeignKey
ALTER TABLE "ReceptionDay" ADD CONSTRAINT "ReceptionDay_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReceptionDay" ADD CONSTRAINT "PatientReceptionDay_receptionDayId_fkey" FOREIGN KEY ("receptionDayId") REFERENCES "ReceptionDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReceptionDay" ADD CONSTRAINT "PatientReceptionDay_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
