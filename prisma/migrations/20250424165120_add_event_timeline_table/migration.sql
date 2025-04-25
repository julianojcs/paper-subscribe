-- CreateEnum
CREATE TYPE "TimelineType" AS ENUM ('SUBMISSION_START', 'SUBMISSION_END', 'REVIEW_START', 'REVIEW_END', 'EVENT_START', 'EVENT_END', 'CUSTOM');

-- CreateTable
CREATE TABLE "EventTimeline" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TimelineType" NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventTimeline_eventId_idx" ON "EventTimeline"("eventId");

-- CreateIndex
CREATE INDEX "EventTimeline_type_idx" ON "EventTimeline"("type");

-- AddForeignKey
ALTER TABLE "EventTimeline" ADD CONSTRAINT "EventTimeline_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
