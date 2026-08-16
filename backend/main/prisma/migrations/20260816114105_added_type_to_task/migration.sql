/*
  Warnings:

  - Added the required column `type` to the `MainTask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MainTask" ADD COLUMN     "type" TEXT NOT NULL;
