/*
  Warnings:

  - You are about to drop the column `metadata` on the `chunks` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `files` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `processing_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chunks" DROP COLUMN "metadata",
ADD COLUMN     "chunk_metadata" JSONB;

-- AlterTable
ALTER TABLE "files" DROP COLUMN "metadata",
ADD COLUMN     "file_metadata" JSONB;

-- AlterTable
ALTER TABLE "processing_jobs" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
