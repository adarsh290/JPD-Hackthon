-- AlterTable
ALTER TABLE "links" ADD COLUMN     "gate_type" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "gate_value" TEXT;
