-- DropForeignKey
ALTER TABLE "MainMessageUsage" DROP CONSTRAINT "MainMessageUsage_messageId_fkey";

-- AddForeignKey
ALTER TABLE "MainMessageUsage" ADD CONSTRAINT "MainMessageUsage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MainChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
