/*
  Warnings:

  - You are about to drop the column `progress` on the `MainTask` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MainChatMessage" ADD COLUMN     "agent" "SubAgent";

-- AlterTable
ALTER TABLE "MainTask" DROP COLUMN "progress";
