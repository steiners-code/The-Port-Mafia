-- CreateEnum
CREATE TYPE "LinkedinMessageStatus" AS ENUM ('QUEUED', 'PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "LinkedinChatMessage" ADD COLUMN     "status" "LinkedinMessageStatus" NOT NULL DEFAULT 'QUEUED';
