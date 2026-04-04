/*
  Warnings:

  - Made the column `imageUrl` on table `Artist` required. This step will fail if there are existing NULL values in that column.
  - Made the column `imageUrl` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('onsale', 'offsale', 'canceled', 'postponed', 'rescheduled');

-- AlterTable
ALTER TABLE "Artist" ALTER COLUMN "imageUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "imageUrl" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EventStatus" NOT NULL;
