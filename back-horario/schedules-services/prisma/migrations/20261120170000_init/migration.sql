-- CreateTable
CREATE TABLE `ContractorSchedule` (
    `id` CHAR(36) NOT NULL,
    `contractorId` VARCHAR(64) NOT NULL,
    `dayOfWeek` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `startMinute` SMALLINT UNSIGNED NOT NULL,
    `endMinute` SMALLINT UNSIGNED NOT NULL,
    `validFrom` DATE NOT NULL,
    `validUntil` DATE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContractorSchedule_contractorId_dayOfWeek_isActive_idx`(`contractorId`, `dayOfWeek`, `isActive`),
    INDEX `ContractorSchedule_validFrom_validUntil_idx`(`validFrom`, `validUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
