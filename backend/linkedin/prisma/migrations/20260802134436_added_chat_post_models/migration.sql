-- CreateEnum
CREATE TYPE "LinkedinPostCategory" AS ENUM ('EDUCATIONAL', 'PERSONAL', 'BUILD_IN_PUBLIC', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "LinkedinPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "LinkedinMediaType" AS ENUM ('IMAGE', 'CAROUSEL', 'NONE');

-- CreateEnum
CREATE TYPE "LinkedinTechniqueRole" AS ENUM ('HOOK', 'BODY', 'CTA');

-- CreateEnum
CREATE TYPE "LinkedinTriggerType" AS ENUM ('SYSTEM', 'CRON', 'USER');

-- CreateEnum
CREATE TYPE "LinkedinContentType" AS ENUM ('TEXT', 'TOOL', 'MEDIA', 'THOUGHT');

-- CreateEnum
CREATE TYPE "LinkedinContentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LinkedinLogLevel" AS ENUM ('INFO', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "LinkedinFileType" AS ENUM ('USER', 'EXPERIENCE');

-- CreateTable
CREATE TABLE "LinkedinPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "category" "LinkedinPostCategory" NOT NULL,
    "angle" TEXT,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "hook_technique" TEXT NOT NULL,
    "body_technique" TEXT NOT NULL,
    "cta_technique" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "mediaType" "LinkedinMediaType" NOT NULL,
    "templateId" TEXT,
    "contentSlots" JSONB,
    "status" "LinkedinPostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledDay" TEXT,
    "scheduledWindow" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedinPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinPostTechnique" (
    "postId" TEXT NOT NULL,
    "techniqueSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedinPostTechnique_pkey" PRIMARY KEY ("postId","techniqueSlug")
);

-- CreateTable
CREATE TABLE "LinkedinTechnique" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "role" "LinkedinTechniqueRole" NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "LinkedinPostCategory" NOT NULL,

    CONSTRAINT "LinkedinTechnique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinPostPerformance" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "reactions" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "reposts" INTEGER NOT NULL,
    "impressions" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedinPostPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinAccountSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionsTotal" INTEGER NOT NULL,
    "followersTotal" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedinAccountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinWeekSlotAllocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "category" "LinkedinPostCategory" NOT NULL,
    "allocated" INTEGER NOT NULL,

    CONSTRAINT "LinkedinWeekSlotAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinSlotUsage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "category" "LinkedinPostCategory" NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedinSlotUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "triggerType" "LinkedinTriggerType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedinChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinMessageContent" (
    "id" TEXT NOT NULL,
    "chatMessageId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "contentType" "LinkedinContentType" NOT NULL,
    "status" "LinkedinContentStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinMessageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinLog" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "level" "LinkedinLogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedinLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileType" "LinkedinFileType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinTechnique_slug_key" ON "LinkedinTechnique"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinPostPerformance_postId_day_key" ON "LinkedinPostPerformance"("postId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinAccountSnapshot_userId_date_key" ON "LinkedinAccountSnapshot"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinWeekSlotAllocation_userId_weekStartDate_category_key" ON "LinkedinWeekSlotAllocation"("userId", "weekStartDate", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinSlotUsage_postId_key" ON "LinkedinSlotUsage"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinFile_userId_fileType_key" ON "LinkedinFile"("userId", "fileType");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinMemory_userId_slug_key" ON "LinkedinMemory"("userId", "slug");

-- AddForeignKey
ALTER TABLE "LinkedinPostTechnique" ADD CONSTRAINT "LinkedinPostTechnique_postId_fkey" FOREIGN KEY ("postId") REFERENCES "LinkedinPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinPostTechnique" ADD CONSTRAINT "LinkedinPostTechnique_techniqueSlug_fkey" FOREIGN KEY ("techniqueSlug") REFERENCES "LinkedinTechnique"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinPostPerformance" ADD CONSTRAINT "LinkedinPostPerformance_postId_fkey" FOREIGN KEY ("postId") REFERENCES "LinkedinPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinSlotUsage" ADD CONSTRAINT "LinkedinSlotUsage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "LinkedinPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinChatMessage" ADD CONSTRAINT "LinkedinChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "LinkedinChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinMessageContent" ADD CONSTRAINT "LinkedinMessageContent_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "LinkedinChatMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinLog" ADD CONSTRAINT "LinkedinLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "LinkedinMessageContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
