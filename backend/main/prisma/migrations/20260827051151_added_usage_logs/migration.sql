-- CreateTable
CREATE TABLE "MainMessageUsage" (
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

    CONSTRAINT "MainMessageUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MainMessageUsage" ADD CONSTRAINT "MainMessageUsage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MainChatMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
