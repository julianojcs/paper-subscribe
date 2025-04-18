/*
  Warnings:

  - You are about to drop the column `maxAuthors` on the `Paper` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "maxAuthors" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "Paper" DROP COLUMN "maxAuthors";
