-- CreateEnum
CREATE TYPE "APPTYPE" AS ENUM ('LINKEDIN', 'X', 'REDDIT', 'FACEBOOK', 'INSTAGRAM', 'THREADS', 'TIKTOK');

-- CreateEnum
CREATE TYPE "APPSTATUS" AS ENUM ('CONNECTED', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "connectedApps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "app" "APPTYPE" NOT NULL,
    "status" "APPSTATUS" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectedApps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connectedApps_userId_app_key" ON "connectedApps"("userId", "app");
