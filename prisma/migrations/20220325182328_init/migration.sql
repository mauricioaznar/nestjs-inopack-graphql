-- CreateTable
CREATE TABLE `activities` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `entity_name` VARCHAR(255) NOT NULL,
    `entity_id` INTEGER UNSIGNED NOT NULL,
    `role_id` INTEGER UNSIGNED NULL,
    `branch_id` INTEGER UNSIGNED NULL,

    INDEX `activities_branch_id_foreign`(`branch_id`),
    INDEX `activities_role_id_foreign`(`role_id`),
    INDEX `activities_user_id_foreign`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_contacts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `cellphone` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL DEFAULT '',
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `client_id` INTEGER UNSIGNED NULL,
    `fullname` VARCHAR(255) NOT NULL,

    INDEX `clients_company_id_foreign`(`client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `abbreviation` VARCHAR(255) NOT NULL,
    `house_phone` VARCHAR(255) NOT NULL DEFAULT '',
    `address1` VARCHAR(60) NOT NULL DEFAULT '',
    `address2` VARCHAR(60) NOT NULL DEFAULT '',
    `country` VARCHAR(255) NOT NULL DEFAULT '',
    `city` VARCHAR(255) NOT NULL DEFAULT '',
    `zip_code` VARCHAR(255) NOT NULL DEFAULT '',
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_statuses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `first_name` VARCHAR(255) NOT NULL DEFAULT '',
    `last_name` VARCHAR(255) NOT NULL DEFAULT '',
    `cellphone` VARCHAR(255) NOT NULL DEFAULT '',
    `email` VARCHAR(255) NOT NULL DEFAULT '',
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `employee_type_id` INTEGER UNSIGNED NULL,
    `fullname` VARCHAR(255) NOT NULL DEFAULT '',
    `employee_status_id` INTEGER UNSIGNED NULL,
    `branch_id` INTEGER UNSIGNED NULL,
    `base_salary` DOUBLE NOT NULL DEFAULT 0.00,
    `hours_should_work` DOUBLE NOT NULL DEFAULT 0.00,
    `infonavit` DOUBLE NOT NULL DEFAULT 0.00,
    `credit` DOUBLE NOT NULL DEFAULT 0.00,
    `credit_required` INTEGER NOT NULL DEFAULT 0,
    `order_production_type_id` INTEGER UNSIGNED NULL,

    INDEX `employees_branch_id_foreign`(`branch_id`),
    INDEX `employees_employee_status_id_foreign`(`employee_status_id`),
    INDEX `employees_employee_type_id_foreign`(`employee_type_id`),
    INDEX `employees_order_production_type_id_foreign`(`order_production_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `machine_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `machines` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `machine_type_id` INTEGER UNSIGNED NULL,
    `branch_id` INTEGER UNSIGNED NULL,
    `order_production_type_id` INTEGER UNSIGNED NULL,

    INDEX `machine_order_production_type_id_foreign`(`order_production_type_id`),
    INDEX `machines_branch_id_foreign`(`branch_id`),
    INDEX `machines_machine_type_id_foreign`(`machine_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `timestamp` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_adjustment_products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL DEFAULT '',
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `kilos` DOUBLE NOT NULL,
    `groups` DOUBLE NOT NULL DEFAULT 0.00,
    `group_weight` DOUBLE NOT NULL DEFAULT 0.00,
    `product_id` INTEGER UNSIGNED NULL,
    `order_adjustment_id` INTEGER UNSIGNED NULL,

    INDEX `order_adjustment_products_order_adjustment_id_foreign`(`order_adjustment_id`),
    INDEX `order_adjustment_products_product_id_foreign`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_adjustment_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_adjustments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `date` DATE NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `order_adjustment_type_id` INTEGER UNSIGNED NULL,

    INDEX `order_adjustments_order_adjustment_type_id_foreign`(`order_adjustment_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_production_employees` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `is_leader` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `order_production_id` INTEGER UNSIGNED NULL,
    `employee_id` INTEGER UNSIGNED NULL,

    INDEX `order_production_employees_employee_id_foreign`(`employee_id`),
    INDEX `order_production_employees_order_production_id_foreign`(`order_production_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_production_products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `kilos` DOUBLE NOT NULL,
    `groups` DOUBLE NOT NULL DEFAULT 0.00,
    `group_weight` DOUBLE NOT NULL DEFAULT 0.00,
    `product_id` INTEGER UNSIGNED NULL,
    `machine_id` INTEGER UNSIGNED NULL,
    `order_production_id` INTEGER UNSIGNED NULL,

    INDEX `order_production_products_machine_id_foreign`(`machine_id`),
    INDEX `order_production_products_order_production_id_foreign`(`order_production_id`),
    INDEX `order_production_products_product_id_foreign`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_production_resources` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `kilos` DOUBLE NOT NULL,
    `groups` DOUBLE NULL,
    `group_weight` DOUBLE NULL,
    `product_id` INTEGER UNSIGNED NULL,
    `order_production_id` INTEGER UNSIGNED NULL,

    INDEX `order_production_resources_order_production_id_foreign`(`order_production_id`),
    INDEX `order_production_resources_product_id_foreign`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_production_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_productions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `waste` DOUBLE NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `employee_id` INTEGER UNSIGNED NULL,
    `order_production_type_id` INTEGER UNSIGNED NULL,
    `performance` DOUBLE NOT NULL,
    `branch_id` INTEGER UNSIGNED NULL,
    `start_date` DATE NOT NULL,

    INDEX `order_productions_branch_id_foreign`(`branch_id`),
    INDEX `order_productions_employee_id_foreign`(`employee_id`),
    INDEX `order_productions_order_production_type_id_foreign`(`order_production_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_request_products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `kilos` DOUBLE NOT NULL,
    `groups` DOUBLE NOT NULL DEFAULT 0.00,
    `kilo_price` DOUBLE NOT NULL,
    `group_weight` DOUBLE NOT NULL DEFAULT 0.00,
    `product_id` INTEGER UNSIGNED NULL,
    `order_request_id` INTEGER UNSIGNED NULL,

    INDEX `order_request_products_order_request_id_foreign`(`order_request_id`),
    INDEX `order_request_products_product_id_foreign`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_request_statuses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_requests` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_code` INTEGER NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `date` DATE NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `client_id` INTEGER UNSIGNED NULL,
    `client_contact_id` INTEGER UNSIGNED NULL,
    `order_request_status_id` INTEGER UNSIGNED NULL,
    `estimated_delivery_date` DATE NOT NULL,
    `priority` DOUBLE NOT NULL,

    INDEX `order_requests_client_id_foreign`(`client_contact_id`),
    INDEX `order_requests_company_id_foreign`(`client_id`),
    INDEX `order_requests_order_request_status_id_foreign`(`order_request_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sale_collection_statuses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sale_payment_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sale_payments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `date_paid` DATE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `order_sale_id` INTEGER UNSIGNED NULL,
    `order_sale_collection_status_id` INTEGER UNSIGNED NULL,

    INDEX `order_sale_payments_order_sale_collection_status_id_foreign`(`order_sale_collection_status_id`),
    INDEX `order_sale_payments_order_sale_id_foreign`(`order_sale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sale_products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `kilos` DOUBLE NOT NULL,
    `groups` DOUBLE NOT NULL DEFAULT 0.00,
    `kilo_price` DOUBLE NOT NULL,
    `group_weight` DOUBLE NOT NULL DEFAULT 0.00,
    `product_id` INTEGER UNSIGNED NULL,
    `order_sale_id` INTEGER UNSIGNED NULL,

    INDEX `order_sale_products_order_sale_id_foreign`(`order_sale_id`),
    INDEX `order_sale_products_product_id_foreign`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sale_receipt_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sale_statuses` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_sales` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_code` INTEGER NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `date` DATE NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `client_contact_id` INTEGER UNSIGNED NULL,
    `order_sale_status_id` INTEGER UNSIGNED NULL,
    `order_request_id` INTEGER UNSIGNED NULL,
    `order_sale_receipt_type_id` INTEGER UNSIGNED NULL,
    `order_sale_payment_type_id` INTEGER UNSIGNED NULL,
    `amount_collected` DOUBLE NOT NULL DEFAULT 0.00,
    `order_sale_collection_status_id` INTEGER UNSIGNED NULL,
    `date_collected` DATE NULL,
    `invoice_code` INTEGER NOT NULL DEFAULT 0,

    INDEX `order_sales_client_id_foreign`(`client_contact_id`),
    INDEX `order_sales_order_request_id_foreign`(`order_request_id`),
    INDEX `order_sales_order_sale_collection_status_id_foreign`(`order_sale_collection_status_id`),
    INDEX `order_sales_order_sale_payment_type_id_foreign`(`order_sale_payment_type_id`),
    INDEX `order_sales_order_sale_receipt_type_id_foreign`(`order_sale_receipt_type_id`),
    INDEX `order_sales_order_sale_status_id_foreign`(`order_sale_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `order_production_type_id` INTEGER UNSIGNED NULL,
    `product_type_category_id` INTEGER UNSIGNED NULL,

    INDEX `materials_order_production_type_id_foreign`(`order_production_type_id`),
    INDEX `product_type_product_type_category_id_foreign`(`product_type_category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_type_categories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `group_weight_strict` INTEGER NOT NULL DEFAULT 0,
    `code` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `current_kilo_price` DOUBLE NOT NULL,
    `width` DOUBLE NOT NULL,
    `length` DOUBLE NULL,
    `current_group_weight` DOUBLE NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `product_type_id` INTEGER UNSIGNED NULL,
    `packing_id` INTEGER UNSIGNED NULL,
    `calibre` DOUBLE NOT NULL,
    `order_production_type_id` INTEGER UNSIGNED NULL,

    INDEX `products_material_id_foreign`(`product_type_id`),
    INDEX `products_order_production_type_id_foreign`(`order_production_type_id`),
    INDEX `products_packing_id_foreign`(`packing_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_branches` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_id` INTEGER UNSIGNED NULL,
    `branch_id` INTEGER UNSIGNED NULL,

    INDEX `user_branches_branch_id_foreign`(`branch_id`),
    INDEX `user_branches_user_id_foreign`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `active` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_id` INTEGER UNSIGNED NULL,
    `role_id` INTEGER UNSIGNED NULL,

    INDEX `user_roles_role_id_foreign`(`role_id`),
    INDEX `user_roles_user_id_foreign`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(60) NOT NULL,
    `active` INTEGER NOT NULL DEFAULT 1,
    `remember_token` VARCHAR(100) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `role_id` INTEGER UNSIGNED NULL,
    `fullname` VARCHAR(255) NOT NULL,
    `branch_id` INTEGER UNSIGNED NULL,

    UNIQUE INDEX `users_email_unique`(`email`),
    INDEX `users_branch_id_foreign`(`branch_id`),
    INDEX `users_role_id_foreign`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `client_contacts` ADD CONSTRAINT `client_contacts_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_employee_status_id_foreign` FOREIGN KEY (`employee_status_id`) REFERENCES `employee_statuses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_employee_type_id_foreign` FOREIGN KEY (`employee_type_id`) REFERENCES `employee_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machines` ADD CONSTRAINT `machines_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machines` ADD CONSTRAINT `machines_machine_type_id_foreign` FOREIGN KEY (`machine_type_id`) REFERENCES `machine_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `machines` ADD CONSTRAINT `machine_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_adjustment_products` ADD CONSTRAINT `order_adjustment_products_order_adjustment_id_foreign` FOREIGN KEY (`order_adjustment_id`) REFERENCES `order_adjustments`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_adjustment_products` ADD CONSTRAINT `order_adjustment_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_adjustments` ADD CONSTRAINT `order_adjustments_order_adjustment_type_id_foreign` FOREIGN KEY (`order_adjustment_type_id`) REFERENCES `order_adjustment_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_production_employees` ADD CONSTRAINT `order_production_employees_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_production_employees` ADD CONSTRAINT `order_production_employees_order_production_id_foreign` FOREIGN KEY (`order_production_id`) REFERENCES `order_productions`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_production_products` ADD CONSTRAINT `order_production_products_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_production_products` ADD CONSTRAINT `order_production_products_order_production_id_foreign` FOREIGN KEY (`order_production_id`) REFERENCES `order_productions`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_production_products` ADD CONSTRAINT `order_production_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_production_resources` ADD CONSTRAINT `order_production_resources_order_production_id_foreign` FOREIGN KEY (`order_production_id`) REFERENCES `order_productions`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_production_resources` ADD CONSTRAINT `order_production_resources_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_productions` ADD CONSTRAINT `order_productions_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_productions` ADD CONSTRAINT `order_productions_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_productions` ADD CONSTRAINT `order_productions_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_request_products` ADD CONSTRAINT `order_request_products_order_request_id_foreign` FOREIGN KEY (`order_request_id`) REFERENCES `order_requests`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_request_products` ADD CONSTRAINT `order_request_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_requests` ADD CONSTRAINT `order_requests_client_contact_id_foreign` FOREIGN KEY (`client_contact_id`) REFERENCES `client_contacts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_requests` ADD CONSTRAINT `order_requests_client_id_foreign` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_requests` ADD CONSTRAINT `order_requests_order_request_status_id_foreign` FOREIGN KEY (`order_request_status_id`) REFERENCES `order_request_statuses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sale_payments` ADD CONSTRAINT `order_sale_payments_order_sale_collection_status_id_foreign` FOREIGN KEY (`order_sale_collection_status_id`) REFERENCES `order_sale_collection_statuses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sale_payments` ADD CONSTRAINT `order_sale_payments_order_sale_id_foreign` FOREIGN KEY (`order_sale_id`) REFERENCES `order_sales`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sale_products` ADD CONSTRAINT `order_sale_products_order_sale_id_foreign` FOREIGN KEY (`order_sale_id`) REFERENCES `order_sales`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sale_products` ADD CONSTRAINT `order_sale_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sales` ADD CONSTRAINT `order_sales_client_contact_id_foreign` FOREIGN KEY (`client_contact_id`) REFERENCES `client_contacts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sales` ADD CONSTRAINT `order_sales_order_request_id_foreign` FOREIGN KEY (`order_request_id`) REFERENCES `order_requests`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sales` ADD CONSTRAINT `order_sales_order_sale_collection_status_id_foreign` FOREIGN KEY (`order_sale_collection_status_id`) REFERENCES `order_sale_collection_statuses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sales` ADD CONSTRAINT `order_sales_order_sale_payment_type_id_foreign` FOREIGN KEY (`order_sale_payment_type_id`) REFERENCES `order_sale_payment_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sales` ADD CONSTRAINT `order_sales_order_sale_receipt_type_id_foreign` FOREIGN KEY (`order_sale_receipt_type_id`) REFERENCES `order_sale_receipt_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_sales` ADD CONSTRAINT `order_sales_order_sale_status_id_foreign` FOREIGN KEY (`order_sale_status_id`) REFERENCES `order_sale_statuses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `product_type` ADD CONSTRAINT `materials_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `product_type` ADD CONSTRAINT `product_type_product_type_category_id_foreign` FOREIGN KEY (`product_type_category_id`) REFERENCES `product_type_categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_packing_id_foreign` FOREIGN KEY (`packing_id`) REFERENCES `packings`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_product_type_id_foreign` FOREIGN KEY (`product_type_id`) REFERENCES `product_type`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_branches` ADD CONSTRAINT `user_branches_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_branches` ADD CONSTRAINT `user_branches_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
