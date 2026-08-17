-- CreateEnum
CREATE TYPE "LinkedinMainAgent" AS ENUM ('DAZAI');

-- AlterTable
ALTER TABLE "LinkedinChatMessage" ADD COLUMN     "agent" "LinkedinMainAgent";
