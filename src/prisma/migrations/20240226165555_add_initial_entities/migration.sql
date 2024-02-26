/*
  Warnings:

  - Added the required column `quantity` to the `ReceptionDay` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReceptionDay" ADD COLUMN     "quantity" INTEGER NOT NULL;
