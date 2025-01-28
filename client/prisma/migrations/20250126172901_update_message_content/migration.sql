/*
  Warnings:

  - The `content` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `chatId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_fkey";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "type" "ChatType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "replyTo" TEXT,
ALTER COLUMN "chatId" SET NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB[];

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
