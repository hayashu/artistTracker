-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'unknown';

-- AlterTable
ALTER TABLE "Artist" ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "status" SET DEFAULT 'unknown';
