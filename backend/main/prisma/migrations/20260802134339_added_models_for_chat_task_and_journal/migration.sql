/*
  Warnings:

  - You are about to drop the `connectedApps` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AppType" AS ENUM ('HOME', 'LINKEDIN', 'X', 'REDDIT', 'FACEBOOK', 'INSTAGRAM', 'THREADS', 'TIKTOK');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('CONNECTED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "MainTriggerType" AS ENUM ('SYSTEM', 'CRON', 'USER');

-- CreateEnum
CREATE TYPE "MainContentType" AS ENUM ('TEXT', 'TOOL', 'MEDIA', 'THOUGHT');

-- CreateEnum
CREATE TYPE "MainContentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MainLogLevel" AS ENUM ('INFO', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "MainFileType" AS ENUM ('USER', 'MEMORY');

-- CreateEnum
CREATE TYPE "SubAgent" AS ENUM ('MAHA');

-- CreateEnum
CREATE TYPE "MainTaskStatus" AS ENUM ('PENDING', 'INPROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MainTaskLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- DropTable
DROP TABLE "connectedApps";

-- DropEnum
DROP TYPE "APPSTATUS";

-- DropEnum
DROP TYPE "APPTYPE";

-- CreateTable
CREATE TABLE "ConnectedApps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "app" "AppType" NOT NULL,
    "status" "AppStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedApps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "triggerType" "MainTriggerType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MainChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainMessageContent" (
    "id" TEXT NOT NULL,
    "chatMessageId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "contentType" "MainContentType" NOT NULL,
    "status" "MainContentStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainMessageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainLog" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "level" "MainLogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MainLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileType" "MainFileType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainJournal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainJournalContent" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainJournalContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainJournalTag" (
    "tagId" TEXT NOT NULL,
    "journalContentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MainJournalTag_pkey" PRIMARY KEY ("tagId","journalContentId")
);

-- CreateTable
CREATE TABLE "MainTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "level" "MainTaskLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "MainTaskStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "subAgent" "SubAgent" NOT NULL,
    "subAgentRole" TEXT NOT NULL,
    "subAgentPlatform" "AppType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MainTaskComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MainTaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedApps_userId_app_key" ON "ConnectedApps"("userId", "app");

-- CreateIndex
CREATE UNIQUE INDEX "MainFile_userId_fileType_key" ON "MainFile"("userId", "fileType");

-- CreateIndex
CREATE UNIQUE INDEX "MainJournal_userId_date_key" ON "MainJournal"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MainTag_slug_key" ON "MainTag"("slug");

-- AddForeignKey
ALTER TABLE "MainChatMessage" ADD CONSTRAINT "MainChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "MainChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainMessageContent" ADD CONSTRAINT "MainMessageContent_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "MainChatMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainLog" ADD CONSTRAINT "MainLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "MainMessageContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainJournalContent" ADD CONSTRAINT "MainJournalContent_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "MainJournal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainJournalTag" ADD CONSTRAINT "MainJournalTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MainTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainJournalTag" ADD CONSTRAINT "MainJournalTag_journalContentId_fkey" FOREIGN KEY ("journalContentId") REFERENCES "MainJournalContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MainTaskComment" ADD CONSTRAINT "MainTaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MainTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
