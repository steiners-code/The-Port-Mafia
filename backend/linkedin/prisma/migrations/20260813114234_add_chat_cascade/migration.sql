/*
  Warnings:

  - You are about to drop the column `chatId` on the `LinkedinMemory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LinkedinChatMessage" DROP CONSTRAINT "LinkedinChatMessage_chatId_fkey";

-- DropForeignKey
ALTER TABLE "LinkedinLog" DROP CONSTRAINT "LinkedinLog_contentId_fkey";

-- DropForeignKey
ALTER TABLE "LinkedinMessageContent" DROP CONSTRAINT "LinkedinMessageContent_chatMessageId_fkey";

-- AlterTable
ALTER TABLE "LinkedinMemory" DROP COLUMN "chatId";

-- AddForeignKey
ALTER TABLE "LinkedinChatMessage" ADD CONSTRAINT "LinkedinChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "LinkedinChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinMessageContent" ADD CONSTRAINT "LinkedinMessageContent_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "LinkedinChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinLog" ADD CONSTRAINT "LinkedinLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "LinkedinMessageContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
