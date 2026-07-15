/*
  Warnings:

  - You are about to drop the column `token_type` on the `LinkedinToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "linkedin"."LinkedinToken" DROP COLUMN "token_type";
