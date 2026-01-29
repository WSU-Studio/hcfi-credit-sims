-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "subtitle" TEXT;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
