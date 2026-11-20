-- CreateTable
CREATE TABLE `AttendanceEvent` (
    `id` CHAR(36) NOT NULL,
    `contractorId` VARCHAR(64) NOT NULL,
    `eventType` ENUM('ENTRY', 'EXIT') NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `method` ENUM('QR', 'GPS', 'MANUAL') NOT NULL,
    `siteId` VARCHAR(64) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttendanceEvent_contractorId_occurredAt_idx`(`contractorId`, `occurredAt`),
    INDEX `AttendanceEvent_siteId_occurredAt_idx`(`siteId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
