-- Payment architecture: checkout sessions, audit logs, inventory reservations

-- Menu item optional stock tracking
ALTER TABLE `menu_items` ADD COLUMN `stockQuantity` INTEGER NULL;

-- Payment enrichment
ALTER TABLE `payments` ADD COLUMN `paidAmount` DECIMAL(10, 2) NULL;
ALTER TABLE `payments` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR';
ALTER TABLE `payments` ADD COLUMN `gatewayName` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `gatewayTransactionId` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `gatewayReference` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `gatewayResponse` TEXT NULL;
ALTER TABLE `payments` ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `payments` ADD COLUMN `paidAt` DATETIME(3) NULL;
ALTER TABLE `payments` ADD COLUMN `refundStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE';
ALTER TABLE `payments` ADD COLUMN `attemptCount` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `payments` ADD COLUMN `expiresAt` DATETIME(3) NULL;
ALTER TABLE `payments` ADD COLUMN `invoiceNumber` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Deduplicate payments before unique constraint on orderId
DELETE p1 FROM `payments` p1
INNER JOIN `payments` p2
  ON p1.orderId = p2.orderId AND p1.createdAt < p2.createdAt;

CREATE UNIQUE INDEX `payments_orderId_key` ON `payments`(`orderId`);
CREATE UNIQUE INDEX `payments_gatewayTransactionId_key` ON `payments`(`gatewayTransactionId`);
CREATE UNIQUE INDEX `payments_invoiceNumber_key` ON `payments`(`invoiceNumber`);

-- Checkout sessions
CREATE TABLE `checkout_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191) NOT NULL,
  `paymentMethod` ENUM('COD', 'JAZZCASH', 'EASYPAISA', 'CARD') NOT NULL,
  `deliveryType` ENUM('STANDARD', 'PRIORITY') NOT NULL DEFAULT 'STANDARD',
  `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `addressId` VARCHAR(191) NULL,
  `addressPayload` JSON NULL,
  `orderPayload` JSON NOT NULL,
  `itemsPayload` JSON NOT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  `deliveryCharge` DECIMAL(10, 2) NOT NULL,
  `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `total` DECIMAL(10, 2) NOT NULL,
  `distanceKm` DOUBLE NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'PKR',
  `gatewayName` VARCHAR(191) NOT NULL,
  `gatewayReference` VARCHAR(191) NOT NULL,
  `gatewayTransactionId` VARCHAR(191) NULL,
  `gatewayPayload` TEXT NULL,
  `priceLockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `attemptCount` INTEGER NOT NULL DEFAULT 0,
  `paymentBlockedUntil` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `completedAt` DATETIME(3) NULL,
  `orderId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `checkout_sessions_gatewayReference_key`(`gatewayReference`),
  UNIQUE INDEX `checkout_sessions_gatewayTransactionId_key`(`gatewayTransactionId`),
  UNIQUE INDEX `checkout_sessions_orderId_key`(`orderId`),
  INDEX `checkout_sessions_customerId_status_idx`(`customerId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `checkout_sessions` ADD CONSTRAINT `checkout_sessions_customerId_fkey`
  FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Inventory reservations
CREATE TABLE `inventory_reservations` (
  `id` VARCHAR(191) NOT NULL,
  `checkoutSessionId` VARCHAR(191) NOT NULL,
  `menuItemId` VARCHAR(191) NOT NULL,
  `quantity` INTEGER NOT NULL,
  `status` ENUM('RESERVED', 'CONFIRMED', 'RELEASED') NOT NULL DEFAULT 'RESERVED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `releasedAt` DATETIME(3) NULL,
  INDEX `inventory_reservations_checkoutSessionId_idx`(`checkoutSessionId`),
  INDEX `inventory_reservations_menuItemId_status_idx`(`menuItemId`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `inventory_reservations` ADD CONSTRAINT `inventory_reservations_checkoutSessionId_fkey`
  FOREIGN KEY (`checkoutSessionId`) REFERENCES `checkout_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `inventory_reservations` ADD CONSTRAINT `inventory_reservations_menuItemId_fkey`
  FOREIGN KEY (`menuItemId`) REFERENCES `menu_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Audit logs
CREATE TABLE `audit_logs` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `result` VARCHAR(191) NOT NULL,
  `details` TEXT NULL,
  `ip` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `device` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `audit_logs_action_createdAt_idx`(`action`, `createdAt`),
  INDEX `audit_logs_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
