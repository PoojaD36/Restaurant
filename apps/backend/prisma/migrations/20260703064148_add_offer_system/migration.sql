-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('PERCENTAGE', 'FIXED', 'FREE_DELIVERY', 'BUY_ONE_GET_ONE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "OfferScope" AS ENUM ('PUBLIC', 'RESTAURANT', 'OUTLET');

-- CreateEnum
CREATE TYPE "OfferCombinationType" AS ENUM ('EXCLUSIVE', 'STACKABLE', 'BEST_DEAL');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "appliedOfferCode" TEXT,
ADD COLUMN     "appliedOfferDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "appliedOfferId" INTEGER;

-- CreateTable
CREATE TABLE "offers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "type" "OfferType" NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "scope" "OfferScope" NOT NULL DEFAULT 'PUBLIC',
    "restaurantId" INTEGER,
    "percentageValue" DECIMAL(5,2),
    "fixedAmountValue" DECIMAL(10,2),
    "maxDiscountAmount" DECIMAL(10,2),
    "minOrderAmount" DECIMAL(10,2),
    "requireCode" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "maxUsesPerCustomer" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "validDays" JSONB,
    "validTimeStart" TEXT,
    "validTimeEnd" TEXT,
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "combinationType" "OfferCombinationType" NOT NULL DEFAULT 'EXCLUSIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_outlets" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "outletId" INTEGER NOT NULL,

    CONSTRAINT "offer_outlets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_categories" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "offer_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_menu_items" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,

    CONSTRAINT "offer_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_usages" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_code_key" ON "offers"("code");

-- CreateIndex
CREATE INDEX "offers_code_idx" ON "offers"("code");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offers_restaurantId_idx" ON "offers"("restaurantId");

-- CreateIndex
CREATE INDEX "offers_deletedAt_idx" ON "offers"("deletedAt");

-- CreateIndex
CREATE INDEX "offer_outlets_offerId_idx" ON "offer_outlets"("offerId");

-- CreateIndex
CREATE INDEX "offer_outlets_outletId_idx" ON "offer_outlets"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "offer_outlets_offerId_outletId_key" ON "offer_outlets"("offerId", "outletId");

-- CreateIndex
CREATE INDEX "offer_categories_offerId_idx" ON "offer_categories"("offerId");

-- CreateIndex
CREATE INDEX "offer_categories_categoryId_idx" ON "offer_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "offer_categories_offerId_categoryId_key" ON "offer_categories"("offerId", "categoryId");

-- CreateIndex
CREATE INDEX "offer_menu_items_offerId_idx" ON "offer_menu_items"("offerId");

-- CreateIndex
CREATE INDEX "offer_menu_items_menuItemId_idx" ON "offer_menu_items"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "offer_menu_items_offerId_menuItemId_key" ON "offer_menu_items"("offerId", "menuItemId");

-- CreateIndex
CREATE INDEX "offer_usages_offerId_idx" ON "offer_usages"("offerId");

-- CreateIndex
CREATE INDEX "offer_usages_customerId_idx" ON "offer_usages"("customerId");

-- CreateIndex
CREATE INDEX "offer_usages_orderId_idx" ON "offer_usages"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "offer_usages_offerId_customerId_orderId_key" ON "offer_usages"("offerId", "customerId", "orderId");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_outlets" ADD CONSTRAINT "offer_outlets_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_outlets" ADD CONSTRAINT "offer_outlets_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_categories" ADD CONSTRAINT "offer_categories_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_categories" ADD CONSTRAINT "offer_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_menu_items" ADD CONSTRAINT "offer_menu_items_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_menu_items" ADD CONSTRAINT "offer_menu_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_usages" ADD CONSTRAINT "offer_usages_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_usages" ADD CONSTRAINT "offer_usages_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_usages" ADD CONSTRAINT "offer_usages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
