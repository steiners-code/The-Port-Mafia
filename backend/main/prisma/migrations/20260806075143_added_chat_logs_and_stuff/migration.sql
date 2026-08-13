/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `MainChat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MainChat_userId_key" ON "MainChat"("userId");

-- CreateIndex
CREATE INDEX "MainChatMessage_chatId_createdAt_idx" ON "MainChatMessage"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "MainLog_contentId_createdAt_idx" ON "MainLog"("contentId", "createdAt");

-- CreateIndex
CREATE INDEX "MainMessageContent_chatMessageId_sequence_createdAt_idx" ON "MainMessageContent"("chatMessageId", "sequence", "createdAt");

-- AddForeignKey
ALTER TABLE "ConnectedApps" ADD CONSTRAINT "ConnectedApps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainChat" ADD CONSTRAINT "MainChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
