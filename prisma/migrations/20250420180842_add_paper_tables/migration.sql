/*
  Warnings:

  - The `fieldType` column on the `EventField` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `abstract` on the `Paper` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'RADIO', 'DATE', 'NUMBER', 'EMAIL', 'FILE');

-- AlterTable
ALTER TABLE "EventArea" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EventField" ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "maxWords" INTEGER,
ADD COLUMN     "minWords" INTEGER,
DROP COLUMN "fieldType",
ADD COLUMN     "fieldType" "FieldType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "EventPaperType" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Paper" DROP COLUMN "abstract",
ADD COLUMN     "maxKeywords" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "minKeywords" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "PaperAuthor" ADD COLUMN     "city" TEXT,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "stateId" CHAR(2),
ALTER COLUMN "userId" DROP NOT NULL;
