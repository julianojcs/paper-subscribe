/*
  Warnings:

  - You are about to drop the column `description` on the `EventField` table. All the data in the column will be lost.
  - You are about to drop the column `helpText` on the `EventField` table. All the data in the column will be lost.
  - You are about to drop the column `maxKeywords` on the `Paper` table. All the data in the column will be lost.
  - You are about to drop the column `minKeywords` on the `Paper` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "maxFileSize" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxFiles" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maxKeywords" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "minKeywords" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "EventField" DROP COLUMN "description",
DROP COLUMN "helpText",
ADD COLUMN     "defaultValue" TEXT,
ADD COLUMN     "helperText" TEXT,
ADD COLUMN     "placeholder" TEXT;

-- AlterTable
ALTER TABLE "Paper" DROP COLUMN "maxKeywords",
DROP COLUMN "minKeywords";
