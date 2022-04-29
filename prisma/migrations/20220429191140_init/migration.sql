/*
  Warnings:

  - You are about to drop the column `performance` on the `order_productions` table. All the data in the column will be lost.
  - You are about to drop the `order_production_resources` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `order_production_resources` DROP FOREIGN KEY `order_production_resources_order_production_id_foreign`;

-- DropForeignKey
ALTER TABLE `order_production_resources` DROP FOREIGN KEY `order_production_resources_product_id_foreign`;

-- AlterTable
ALTER TABLE `order_productions` DROP COLUMN `performance`;

-- DropTable
DROP TABLE `order_production_resources`;

-- CreateTable
CREATE TABLE `machine_compatibilities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `machine_part_id` INTEGER UNSIGNED NULL,
    `spare_id` INTEGER UNSIGNED NULL,

    INDEX `machine_compatibilities_machine_part_id_foreign`(`machine_part_id`),
    INDEX `machine_compatibilities_spare_id_foreign`(`spare_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `machine_parts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `machine_section_id` INTEGER UNSIGNED NULL,
    `machine_id` INTEGER UNSIGNED NULL,
    `current_spare_id` INTEGER UNSIGNED NULL,
    `current_spare_required_quantity` INTEGER UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,

    INDEX `machine_parts_current_spare_id_foreign`(`current_spare_id`),
    INDEX `machine_parts_machine_id_foreign`(`machine_id`),
    INDEX `machine_parts_machine_section_id_foreign`(`machine_section_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `machine_sections` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `machine_id` INTEGER UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,

    INDEX `machine_sections_machine_id_foreign`(`machine_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_operations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `date` DATETIME(0) NULL,
    `description` VARCHAR(255) NOT NULL,
    `is_adjustment` TINYINT NOT NULL DEFAULT 1,
    `is_withdrawal` TINYINT NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spare_transactions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `spare_id` INTEGER UNSIGNED NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `spare_operation_id` INTEGER UNSIGNED NULL,

    INDEX `spare_transactions_spare_id_foreign`(`spare_id`),
    INDEX `spare_transactions_spare_operation_id_foreign`(`spare_operation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spares` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `spare_category_id` INTEGER UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,

    INDEX `spares_spare_category_id_foreign`(`spare_category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `machine_compatibilities` ADD CONSTRAINT `machine_compatibilities_machine_part_id_foreign` FOREIGN KEY (`machine_part_id`) REFERENCES `machine_parts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machine_compatibilities` ADD CONSTRAINT `machine_compatibilities_spare_id_foreign` FOREIGN KEY (`spare_id`) REFERENCES `spares`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machine_parts` ADD CONSTRAINT `machine_parts_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machine_parts` ADD CONSTRAINT `machine_parts_machine_section_id_foreign` FOREIGN KEY (`machine_section_id`) REFERENCES `machine_sections`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machine_parts` ADD CONSTRAINT `machine_parts_current_spare_id_foreign` FOREIGN KEY (`current_spare_id`) REFERENCES `spares`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machine_sections` ADD CONSTRAINT `machine_sections_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spare_transactions` ADD CONSTRAINT `spare_transactions_spare_operation_id_foreign` FOREIGN KEY (`spare_operation_id`) REFERENCES `spare_operations`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spare_transactions` ADD CONSTRAINT `spare_transactions_spare_id_foreign` FOREIGN KEY (`spare_id`) REFERENCES `spares`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `spares` ADD CONSTRAINT `spares_spare_category_id_foreign` FOREIGN KEY (`spare_category_id`) REFERENCES `spare_categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
