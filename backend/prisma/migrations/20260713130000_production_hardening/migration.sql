-- Production hardening: branches, system config, invoice sequences, system logs

CREATE TABLE `branches` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `address` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `branches_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `system_config` (
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `label` VARCHAR(191) NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `updatedBy` VARCHAR(191) NULL,
  INDEX `system_config_category_idx`(`category`),
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `invoice_sequences` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `dateKey` VARCHAR(191) NOT NULL,
  `seq` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `invoice_sequences_dateKey_key`(`dateKey`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `system_logs` (
  `id` VARCHAR(191) NOT NULL,
  `severity` ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL') NOT NULL DEFAULT 'ERROR',
  `module` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `stack` TEXT NULL,
  `requestId` VARCHAR(191) NULL,
  `userId` VARCHAR(191) NULL,
  `ip` VARCHAR(191) NULL,
  `device` VARCHAR(191) NULL,
  `details` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `system_logs_severity_createdAt_idx`(`severity`, `createdAt`),
  INDEX `system_logs_module_createdAt_idx`(`module`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `backup_logs` (
  `id` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NULL,
  `sizeBytes` INTEGER NULL,
  `triggeredBy` VARCHAR(191) NULL,
  `details` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `backup_logs_type_createdAt_idx`(`type`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `categories` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `menu_items` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `discounts` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `orders` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `checkout_sessions` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `reviews` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `notifications` ADD COLUMN `branchId` VARCHAR(191) NULL;

ALTER TABLE `categories` ADD CONSTRAINT `categories_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `discounts` ADD CONSTRAINT `discounts_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `orders` ADD CONSTRAINT `orders_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `checkout_sessions` ADD CONSTRAINT `checkout_sessions_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `branches` (`id`, `name`, `code`, `isDefault`, `isActive`, `address`, `phone`, `latitude`, `longitude`, `createdAt`, `updatedAt`)
SELECT UUID(), 'UCP Branch', 'UCP', true, true, 'UCP Road, Block C, Johar Town, Lahore', '+923001234567', 31.4475531, 74.2690347, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `branches` WHERE `code` = 'UCP');
