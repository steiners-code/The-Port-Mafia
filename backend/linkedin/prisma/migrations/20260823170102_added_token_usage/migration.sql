-- CreateTable
CREATE TABLE "linkedinMessageUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "reasoningTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "toolUseTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linkedinMessageUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "linkedinMessageUsage" ADD CONSTRAINT "linkedinMessageUsage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "LinkedinChatMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
