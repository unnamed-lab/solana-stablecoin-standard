-- CreateTable
CREATE TABLE "AllowlistEntry" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "allowedOperations" INTEGER NOT NULL,
    "kycTier" INTEGER NOT NULL,
    "expiry" BIGINT NOT NULL DEFAULT 0,
    "addedBy" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "removedBy" TEXT,
    "removedAt" TIMESTAMP(3),
    "txSignature" TEXT NOT NULL,
    "onChainTimestamp" BIGINT NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllowlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowlistEntry_txSignature_key" ON "AllowlistEntry"("txSignature");

-- CreateIndex
CREATE INDEX "AllowlistEntry_mint_active_idx" ON "AllowlistEntry"("mint", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AllowlistEntry_mint_address_key" ON "AllowlistEntry"("mint", "address");
