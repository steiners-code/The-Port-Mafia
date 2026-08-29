-- DropForeignKey
ALTER TABLE "LinkedinPostPerformance" DROP CONSTRAINT "LinkedinPostPerformance_postId_fkey";

-- DropForeignKey
ALTER TABLE "LinkedinPostTechnique" DROP CONSTRAINT "LinkedinPostTechnique_postId_fkey";

-- DropForeignKey
ALTER TABLE "LinkedinPostTechnique" DROP CONSTRAINT "LinkedinPostTechnique_techniqueSlug_fkey";

-- DropForeignKey
ALTER TABLE "linkedinMessageUsage" DROP CONSTRAINT "linkedinMessageUsage_messageId_fkey";

-- AddForeignKey
ALTER TABLE "LinkedinPostTechnique" ADD CONSTRAINT "LinkedinPostTechnique_postId_fkey" FOREIGN KEY ("postId") REFERENCES "LinkedinPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinPostTechnique" ADD CONSTRAINT "LinkedinPostTechnique_techniqueSlug_fkey" FOREIGN KEY ("techniqueSlug") REFERENCES "LinkedinTechnique"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinPostPerformance" ADD CONSTRAINT "LinkedinPostPerformance_postId_fkey" FOREIGN KEY ("postId") REFERENCES "LinkedinPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedinMessageUsage" ADD CONSTRAINT "linkedinMessageUsage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "LinkedinChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
