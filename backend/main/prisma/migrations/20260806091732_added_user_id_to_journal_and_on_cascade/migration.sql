/*
  Warnings:

  - Added the required column `userId` to the `MainTask` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ConnectedApps" DROP CONSTRAINT "ConnectedApps_userId_fkey";

-- DropForeignKey
ALTER TABLE "MainChat" DROP CONSTRAINT "MainChat_userId_fkey";

-- DropForeignKey
ALTER TABLE "MainChatMessage" DROP CONSTRAINT "MainChatMessage_chatId_fkey";

-- DropForeignKey
ALTER TABLE "MainJournalContent" DROP CONSTRAINT "MainJournalContent_journalId_fkey";

-- DropForeignKey
ALTER TABLE "MainLog" DROP CONSTRAINT "MainLog_contentId_fkey";

-- DropForeignKey
ALTER TABLE "MainMessageContent" DROP CONSTRAINT "MainMessageContent_chatMessageId_fkey";

-- DropForeignKey
ALTER TABLE "MainTaskComment" DROP CONSTRAINT "MainTaskComment_taskId_fkey";

-- AlterTable
ALTER TABLE "MainTask" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ConnectedApps" ADD CONSTRAINT "ConnectedApps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainChat" ADD CONSTRAINT "MainChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainChatMessage" ADD CONSTRAINT "MainChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "MainChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainMessageContent" ADD CONSTRAINT "MainMessageContent_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "MainChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainLog" ADD CONSTRAINT "MainLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "MainMessageContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainJournal" ADD CONSTRAINT "MainJournal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainJournalContent" ADD CONSTRAINT "MainJournalContent_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "MainJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainTask" ADD CONSTRAINT "MainTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainTaskComment" ADD CONSTRAINT "MainTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MainTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
