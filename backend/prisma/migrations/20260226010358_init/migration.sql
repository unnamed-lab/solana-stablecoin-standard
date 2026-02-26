-- CreateTable
CREATE TABLE "MintEvent" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "minter" TEXT NOT NULL,
    "newTotalSupply" BIGINT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "onChainTimestamp" BIGINT NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MintEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurnEvent" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "burner" TEXT NOT NULL,
    "newTotalSupply" BIGINT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "onChainTimestamp" BIGINT NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BurnEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blacklistedBy" TEXT NOT NULL,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "removedBy" TEXT,
    "removedAt" TIMESTAMP(3),
    "txSignature" TEXT NOT NULL,
    "onChainTimestamp" BIGINT NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeizureEvent" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "seizedFrom" TEXT NOT NULL,
    "seizedTo" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "seizer" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "onChainTimestamp" BIGINT NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeizureEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "mint" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "target" TEXT,
    "amount" BIGINT,
    "reason" TEXT,
    "txSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookConfig" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MintEvent_txSignature_key" ON "MintEvent"("txSignature");

-- CreateIndex
CREATE INDEX "MintEvent_mint_idx" ON "MintEvent"("mint");

-- CreateIndex
CREATE INDEX "MintEvent_recipient_idx" ON "MintEvent"("recipient");

-- CreateIndex
CREATE INDEX "MintEvent_indexedAt_idx" ON "MintEvent"("indexedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BurnEvent_txSignature_key" ON "BurnEvent"("txSignature");

-- CreateIndex
CREATE INDEX "BurnEvent_mint_idx" ON "BurnEvent"("mint");

-- CreateIndex
CREATE INDEX "BurnEvent_source_idx" ON "BurnEvent"("source");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistEntry_txSignature_key" ON "BlacklistEntry"("txSignature");

-- CreateIndex
CREATE INDEX "BlacklistEntry_mint_removed_idx" ON "BlacklistEntry"("mint", "removed");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistEntry_mint_address_key" ON "BlacklistEntry"("mint", "address");

-- CreateIndex
CREATE UNIQUE INDEX "SeizureEvent_txSignature_key" ON "SeizureEvent"("txSignature");

-- CreateIndex
CREATE INDEX "SeizureEvent_mint_idx" ON "SeizureEvent"("mint");

-- CreateIndex
CREATE INDEX "SeizureEvent_seizedFrom_idx" ON "SeizureEvent"("seizedFrom");

-- CreateIndex
CREATE INDEX "AuditLog_mint_action_idx" ON "AuditLog"("mint", "action");

-- CreateIndex
CREATE INDEX "AuditLog_mint_createdAt_idx" ON "AuditLog"("mint", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actor_idx" ON "AuditLog"("actor");
