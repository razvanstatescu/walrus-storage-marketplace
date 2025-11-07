-- CreateTable
CREATE TABLE "event_cursor" (
    "id" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_cursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_listed_events" (
    "id" TEXT NOT NULL,
    "storageId" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "pricePerSizePerEpoch" BIGINT NOT NULL,
    "size" BIGINT NOT NULL,
    "startEpoch" INTEGER NOT NULL,
    "endEpoch" INTEGER NOT NULL,
    "totalPrice" BIGINT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_listed_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_purchased_events" (
    "id" TEXT NOT NULL,
    "storageId" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "amountPaid" BIGINT NOT NULL,
    "purchaseType" TEXT NOT NULL,
    "purchasedSize" BIGINT NOT NULL,
    "purchasedStartEpoch" INTEGER NOT NULL,
    "purchasedEndEpoch" INTEGER NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_purchased_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_delisted_events" (
    "id" TEXT NOT NULL,
    "storageId" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "eventSeq" TEXT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_delisted_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listed_storage" (
    "id" TEXT NOT NULL,
    "storageId" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "pricePerSizePerEpoch" BIGINT NOT NULL,
    "size" BIGINT NOT NULL,
    "startEpoch" INTEGER NOT NULL,
    "endEpoch" INTEGER NOT NULL,
    "totalPrice" BIGINT NOT NULL,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "lastTxDigest" TEXT NOT NULL,
    "lastEventSeq" TEXT NOT NULL,

    CONSTRAINT "listed_storage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storage_listed_events_storageId_idx" ON "storage_listed_events"("storageId");

-- CreateIndex
CREATE INDEX "storage_listed_events_seller_idx" ON "storage_listed_events"("seller");

-- CreateIndex
CREATE INDEX "storage_listed_events_createdAt_idx" ON "storage_listed_events"("createdAt");

-- CreateIndex
CREATE INDEX "storage_purchased_events_storageId_idx" ON "storage_purchased_events"("storageId");

-- CreateIndex
CREATE INDEX "storage_purchased_events_buyer_idx" ON "storage_purchased_events"("buyer");

-- CreateIndex
CREATE INDEX "storage_purchased_events_seller_idx" ON "storage_purchased_events"("seller");

-- CreateIndex
CREATE INDEX "storage_purchased_events_purchaseType_idx" ON "storage_purchased_events"("purchaseType");

-- CreateIndex
CREATE INDEX "storage_purchased_events_createdAt_idx" ON "storage_purchased_events"("createdAt");

-- CreateIndex
CREATE INDEX "storage_delisted_events_storageId_idx" ON "storage_delisted_events"("storageId");

-- CreateIndex
CREATE INDEX "storage_delisted_events_seller_idx" ON "storage_delisted_events"("seller");

-- CreateIndex
CREATE INDEX "storage_delisted_events_createdAt_idx" ON "storage_delisted_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "listed_storage_storageId_key" ON "listed_storage"("storageId");

-- CreateIndex
CREATE INDEX "listed_storage_seller_idx" ON "listed_storage"("seller");

-- CreateIndex
CREATE INDEX "listed_storage_pricePerSizePerEpoch_idx" ON "listed_storage"("pricePerSizePerEpoch");

-- CreateIndex
CREATE INDEX "listed_storage_size_idx" ON "listed_storage"("size");

-- CreateIndex
CREATE INDEX "listed_storage_startEpoch_idx" ON "listed_storage"("startEpoch");

-- CreateIndex
CREATE INDEX "listed_storage_endEpoch_idx" ON "listed_storage"("endEpoch");

-- CreateIndex
CREATE INDEX "listed_storage_listedAt_idx" ON "listed_storage"("listedAt");
