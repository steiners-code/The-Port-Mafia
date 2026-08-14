/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `LinkedinChat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LinkedinChat_userId_key" ON "LinkedinChat"("userId");

-- AddForeignKey
ALTER TABLE "LinkedinChat" ADD CONSTRAINT "LinkedinChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "LinkedinProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
