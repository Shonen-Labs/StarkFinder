/*
  Warnings:

  - You are about to drop the column `metadata` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `replyTo` on the `Message` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `content` on the `Message` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('GENERAL', 'TRANSACTION', 'ASK');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('SWAP', 'TRANSFER', 'BRIDGE', 'DEPOSIT', 'WITHDRAW');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "metadata",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "replyTo",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "chatId" DROP NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TxType" NOT NULL,
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "hash" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
