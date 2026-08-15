-- CreateEnum
CREATE TYPE "MainMessageStatus" AS ENUM ('QUEUED', 'PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "MainChatMessage" ADD COLUMN     "status" "MainMessageStatus" NOT NULL DEFAULT 'QUEUED';
