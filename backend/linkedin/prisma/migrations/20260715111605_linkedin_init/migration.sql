-- CreateTable
CREATE TABLE "LinkedinProfile" (
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
CREATE TABLE "LinkedinToken" (
    "userId" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "access_token_expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "refresh_token_expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinToken_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinProfile_userId_key" ON "LinkedinProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinProfile_email_key" ON "LinkedinProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinProfile_sub_key" ON "LinkedinProfile"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedinToken_userId_key" ON "LinkedinToken"("userId");

-- AddForeignKey
ALTER TABLE "LinkedinToken" ADD CONSTRAINT "LinkedinToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "LinkedinProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
