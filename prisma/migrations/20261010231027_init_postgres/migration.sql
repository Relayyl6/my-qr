-- CreateTable
CREATE TABLE "QrLink" (
    "id" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "label" TEXT,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QrLink_shortCode_key" ON "QrLink"("shortCode");

-- CreateIndex
CREATE INDEX "QrLink_shortCode_idx" ON "QrLink"("shortCode");
