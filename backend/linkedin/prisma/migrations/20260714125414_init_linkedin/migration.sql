-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "linkedin";

-- CreateTable
CREATE TABLE "linkedin"."LinkedinProfile" (
    "userId" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "given_name" TEXT NOT NULL,
    "family_name" TEXT,
    "email" TEXT NOT NULL,
    "locale_country" TEXT NOT NULL,
    "locale_language" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LinkedinProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "linkedin"."LinkedinToken" (
    "userId" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "access_token_expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "refresh_token_expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinToken_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinProfile_userId_key" ON "linkedin"."LinkedinProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinProfile_email_key" ON "linkedin"."LinkedinProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinProfile_sub_key" ON "linkedin"."LinkedinProfile"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinToken_userId_key" ON "linkedin"."LinkedinToken"("userId");

-- AddForeignKey
ALTER TABLE "linkedin"."LinkedinToken" ADD CONSTRAINT "LinkedinToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "linkedin"."LinkedinProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
