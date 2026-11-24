CREATE TABLE `Contractor` (
    `contractorId` VARCHAR(64) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `documentNumber` VARCHAR(40) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(30) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Contractor_documentNumber_key`(`documentNumber`),
    INDEX `Contractor_lastName_firstName_idx`(`lastName`, `firstName`),
    INDEX `Contractor_isActive_idx`(`isActive`),
    PRIMARY KEY (`contractorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
