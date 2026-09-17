-- MySQL dump 10.13  Distrib 8.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: inopack_schema_src
-- ------------------------------------------------------
-- Server version	8.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_contacts`
--

DROP TABLE IF EXISTS `account_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_contacts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `first_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `cellphone` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `account_id` int unsigned DEFAULT NULL,
  `fullname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clients_company_id_foreign` (`account_id`),
  CONSTRAINT `client_contacts_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `account_products`
--

DROP TABLE IF EXISTS `account_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `kilo_price` double NOT NULL DEFAULT '0',
  `group_price` double NOT NULL DEFAULT '0',
  `group_weight` double NOT NULL DEFAULT '0',
  `account_id` int unsigned DEFAULT NULL,
  `product_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_products_account_id_foreign` (`account_id`),
  KEY `account_products_product_id_foreign` (`product_id`),
  CONSTRAINT `account_products_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `account_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1037 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `account_resources`
--

DROP TABLE IF EXISTS `account_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_resources` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `unit_price` double NOT NULL DEFAULT '0',
  `notes` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `account_id` int unsigned DEFAULT NULL,
  `resource_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `account_resources_account_id_foreign` (`account_id`),
  KEY `account_resources_resource_id_foreign` (`resource_id`),
  CONSTRAINT `account_resources_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `account_resources_resource_id_foreign` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=512 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `abbreviation` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `house_phone` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `address1` varchar(60) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `address2` varchar(60) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `country` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `city` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `zip_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_supplier` tinyint(1) NOT NULL DEFAULT '0',
  `is_client` tinyint(1) NOT NULL DEFAULT '0',
  `is_own` tinyint(1) NOT NULL DEFAULT '0',
  `requires_order_request` tinyint(1) NOT NULL DEFAULT '1',
  `resource_id` int unsigned DEFAULT NULL,
  `monitor_supplier_expenses` tinyint(1) NOT NULL DEFAULT '0',
  `client_credit_days` int NOT NULL DEFAULT '0',
  `supplier_credit_days` int NOT NULL DEFAULT '0',
  `client_require_credit_note` tinyint(1) NOT NULL DEFAULT '0',
  `client_require_supplement` tinyint(1) NOT NULL DEFAULT '1',
  `supplier_require_external_code` tinyint(1) NOT NULL DEFAULT '0',
  `supplier_require_supplement` tinyint(1) NOT NULL DEFAULT '0',
  `client_automatic_tax_calculation` tinyint(1) NOT NULL DEFAULT '1',
  `exclude_from_accountability_export` tinyint(1) NOT NULL DEFAULT '0',
  `supplier_recurring_expenses` tinyint(1) NOT NULL DEFAULT '0',
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `merged_into_account_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `accounts_resource_id_foreign` (`resource_id`),
  KEY `accounts_created_by_id_foreign` (`created_by_id`),
  KEY `accounts_updated_by_id_foreign` (`updated_by_id`),
  KEY `accounts_merged_into_account_id_idx` (`merged_into_account_id`),
  CONSTRAINT `accounts_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `accounts_merged_into_account_id_foreign` FOREIGN KEY (`merged_into_account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `accounts_resource_id_foreign` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`),
  CONSTRAINT `accounts_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=393 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `user_id` int unsigned NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `entity_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `entity_id` int unsigned NOT NULL,
  `role_id` int unsigned DEFAULT NULL,
  `branch_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activities_user_id_foreign` (`user_id`),
  KEY `activities_role_id_foreign` (`role_id`),
  KEY `activities_branch_id_foreign` (`branch_id`),
  CONSTRAINT `activities_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `activities_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70578 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_categories`
--

DROP TABLE IF EXISTS `employee_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_type`
--

DROP TABLE IF EXISTS `employee_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `first_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `last_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `cellphone` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `employee_type_id` int unsigned DEFAULT NULL,
  `fullname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `branch_id` int unsigned DEFAULT NULL,
  `base_salary` double(8,2) NOT NULL DEFAULT '0.00',
  `hours_should_work` double(8,2) NOT NULL DEFAULT '0.00',
  `infonavit` double(8,2) NOT NULL DEFAULT '0.00',
  `credit` double(8,2) NOT NULL DEFAULT '0.00',
  `credit_required` int NOT NULL DEFAULT '0',
  `order_production_type_id` int unsigned DEFAULT NULL,
  `is_leader` int NOT NULL DEFAULT '0',
  `employee_category_id` int unsigned DEFAULT NULL,
  `is_inactive` tinyint(1) NOT NULL DEFAULT '0',
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employees_employee_type_id_foreign` (`employee_type_id`),
  KEY `employees_branch_id_foreign` (`branch_id`),
  KEY `employees_order_production_type_id_foreign` (`order_production_type_id`),
  KEY `employees_employee_category_id_foreign` (`employee_category_id`),
  KEY `employees_created_by_id_foreign` (`created_by_id`),
  KEY `employees_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `employees_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `employees_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `employees_employee_category_id_foreign` FOREIGN KEY (`employee_category_id`) REFERENCES `employee_categories` (`id`),
  CONSTRAINT `employees_employee_type_id_foreign` FOREIGN KEY (`employee_type_id`) REFERENCES `employee_type` (`id`),
  CONSTRAINT `employees_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type` (`id`),
  CONSTRAINT `employees_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=232 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_resources`
--

DROP TABLE IF EXISTS `expense_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_resources` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `units` double(8,2) NOT NULL,
  `unit_price` double(12,2) DEFAULT '0.00',
  `resource_id` int unsigned DEFAULT NULL,
  `expense_id` int unsigned DEFAULT NULL,
  `notes` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_resources_resource_id_foreign` (`resource_id`),
  KEY `expense_resources_expense_id_foreign` (`expense_id`),
  CONSTRAINT `expense_resources_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`),
  CONSTRAINT `expense_resources_resource_id_foreign` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9236 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_statuses`
--

DROP TABLE IF EXISTS `expense_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_statuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `color` varchar(7) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `date` datetime NOT NULL,
  `expected_payment_date` datetime DEFAULT NULL,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `external_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `account_id` int unsigned DEFAULT NULL,
  `receipt_type_id` int unsigned DEFAULT NULL,
  `notes` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `tax` double(12,2) unsigned NOT NULL DEFAULT '0.00',
  `tax_retained` double(12,2) unsigned NOT NULL DEFAULT '0.00',
  `non_tax_retained` double(12,2) unsigned NOT NULL DEFAULT '0.00',
  `supplement_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `require_supplement` tinyint(1) NOT NULL DEFAULT '0',
  `canceled` tinyint(1) NOT NULL DEFAULT '0',
  `subtotal` double(12,2) NOT NULL DEFAULT '0.00',
  `transfer_receipts_total` double(12,2) NOT NULL DEFAULT '0.00',
  `transfer_receipts_total_no_adjustments` double(12,2) NOT NULL DEFAULT '0.00',
  `total_with_tax` double(12,2) NOT NULL DEFAULT '0.00',
  `require_external_code` tinyint(1) NOT NULL DEFAULT '1',
  `resources_total` double(12,2) DEFAULT '0.00',
  `expense_status_id` int unsigned DEFAULT NULL,
  `internal_code` int NOT NULL DEFAULT '0',
  `generated_from_expense_id` int unsigned DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `reconciliation_only` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `expenses_account_id_foreign` (`account_id`),
  KEY `expenses_receipt_type_foreign` (`receipt_type_id`),
  KEY `expenses_expense_status_id_foreign` (`expense_status_id`),
  KEY `expenses_generated_from_expense_id_idx` (`generated_from_expense_id`),
  KEY `expenses_created_by_id_foreign` (`created_by_id`),
  KEY `expenses_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `expenses_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `expenses_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_expense_status_id_foreign` FOREIGN KEY (`expense_status_id`) REFERENCES `expense_statuses` (`id`),
  CONSTRAINT `expenses_generated_from_expense_id_foreign` FOREIGN KEY (`generated_from_expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenses_receipt_type_foreign` FOREIGN KEY (`receipt_type_id`) REFERENCES `receipt_types` (`id`),
  CONSTRAINT `expenses_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5065 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machine_compatibilities`
--

DROP TABLE IF EXISTS `machine_compatibilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_compatibilities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `machine_part_id` int unsigned DEFAULT NULL,
  `spare_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_compatibilities_machine_part_id_foreign` (`machine_part_id`),
  KEY `machine_compatibilities_spare_id_foreign` (`spare_id`),
  CONSTRAINT `machine_compatibilities_machine_part_id_foreign` FOREIGN KEY (`machine_part_id`) REFERENCES `machine_parts` (`id`),
  CONSTRAINT `machine_compatibilities_spare_id_foreign` FOREIGN KEY (`spare_id`) REFERENCES `spares` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machine_parts`
--

DROP TABLE IF EXISTS `machine_parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_parts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `machine_section_id` int unsigned DEFAULT NULL,
  `machine_id` int unsigned DEFAULT NULL,
  `current_spare_id` int unsigned DEFAULT NULL,
  `current_spare_required_quantity` int unsigned DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_parts_machine_section_id_foreign` (`machine_section_id`),
  KEY `machine_parts_machine_id_foreign` (`machine_id`),
  KEY `machine_parts_current_spare_id_foreign` (`current_spare_id`),
  CONSTRAINT `machine_parts_current_spare_id_foreign` FOREIGN KEY (`current_spare_id`) REFERENCES `spares` (`id`),
  CONSTRAINT `machine_parts_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `machine_parts_machine_section_id_foreign` FOREIGN KEY (`machine_section_id`) REFERENCES `machine_sections` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machine_sections`
--

DROP TABLE IF EXISTS `machine_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_sections` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `machine_id` int unsigned DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_sections_machine_id_foreign` (`machine_id`),
  CONSTRAINT `machine_sections_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machine_type`
--

DROP TABLE IF EXISTS `machine_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `machines`
--

DROP TABLE IF EXISTS `machines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machines` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `machine_type_id` int unsigned DEFAULT NULL,
  `branch_id` int unsigned DEFAULT NULL,
  `order_production_type_id` int unsigned DEFAULT NULL,
  `discontinued` tinyint(1) NOT NULL DEFAULT '0',
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `machines_machine_type_id_foreign` (`machine_type_id`),
  KEY `machines_branch_id_foreign` (`branch_id`),
  KEY `machine_order_production_type_id_foreign` (`order_production_type_id`),
  KEY `machines_created_by_id_foreign` (`created_by_id`),
  KEY `machines_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `machine_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type` (`id`),
  CONSTRAINT `machines_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `machines_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `machines_machine_type_id_foreign` FOREIGN KEY (`machine_type_id`) REFERENCES `machine_type` (`id`),
  CONSTRAINT `machines_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_adjustment_products`
--

DROP TABLE IF EXISTS `order_adjustment_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_adjustment_products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `kilos` double(8,2) NOT NULL,
  `groups` double(8,2) NOT NULL DEFAULT '0.00',
  `group_weight` double(8,2) NOT NULL DEFAULT '0.00',
  `product_id` int unsigned DEFAULT NULL,
  `order_adjustment_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_adjustment_products_product_id_foreign` (`product_id`),
  KEY `order_adjustment_products_order_adjustment_id_foreign` (`order_adjustment_id`),
  CONSTRAINT `order_adjustment_products_order_adjustment_id_foreign` FOREIGN KEY (`order_adjustment_id`) REFERENCES `order_adjustments` (`id`),
  CONSTRAINT `order_adjustment_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2220 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_adjustment_type`
--

DROP TABLE IF EXISTS `order_adjustment_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_adjustment_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_adjustments`
--

DROP TABLE IF EXISTS `order_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_adjustments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `date` datetime NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `order_adjustment_type_id` int unsigned DEFAULT NULL,
  `order_sale_id` int unsigned DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_adjustments_order_adjustment_type_id_foreign` (`order_adjustment_type_id`),
  KEY `order_adjustments_order_sale_id_foreign` (`order_sale_id`),
  KEY `order_adjustments_created_by_id_foreign` (`created_by_id`),
  KEY `order_adjustments_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `order_adjustments_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `order_adjustments_order_adjustment_type_id_foreign` FOREIGN KEY (`order_adjustment_type_id`) REFERENCES `order_adjustment_type` (`id`),
  CONSTRAINT `order_adjustments_order_sale_id_foreign` FOREIGN KEY (`order_sale_id`) REFERENCES `order_sales` (`id`),
  CONSTRAINT `order_adjustments_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=584 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_production_employees`
--

DROP TABLE IF EXISTS `order_production_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_production_employees` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `is_leader` int NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `order_production_id` int unsigned DEFAULT NULL,
  `employee_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_production_employees_order_production_id_foreign` (`order_production_id`),
  KEY `order_production_employees_employee_id_foreign` (`employee_id`),
  CONSTRAINT `order_production_employees_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `order_production_employees_order_production_id_foreign` FOREIGN KEY (`order_production_id`) REFERENCES `order_productions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49890 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_production_products`
--

DROP TABLE IF EXISTS `order_production_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_production_products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `kilos` double(8,2) NOT NULL,
  `groups` double(8,2) NOT NULL DEFAULT '0.00',
  `group_weight` double(8,2) NOT NULL DEFAULT '0.00',
  `product_id` int unsigned DEFAULT NULL,
  `machine_id` int unsigned DEFAULT NULL,
  `order_production_id` int unsigned DEFAULT NULL,
  `hours` double(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_production_products_product_id_foreign` (`product_id`),
  KEY `order_production_products_machine_id_foreign` (`machine_id`),
  KEY `order_production_products_order_production_id_foreign` (`order_production_id`),
  CONSTRAINT `order_production_products_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `order_production_products_order_production_id_foreign` FOREIGN KEY (`order_production_id`) REFERENCES `order_productions` (`id`),
  CONSTRAINT `order_production_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=137808 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_production_resources`
--

DROP TABLE IF EXISTS `order_production_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_production_resources` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `kilos` double(8,2) NOT NULL,
  `groups` double(8,2) DEFAULT NULL,
  `group_weight` double(8,2) DEFAULT NULL,
  `product_id` int unsigned DEFAULT NULL,
  `order_production_id` int unsigned DEFAULT NULL,
  `machine_id` int unsigned DEFAULT NULL,
  `hours` double(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_production_resources_product_id_foreign` (`product_id`),
  KEY `order_production_resources_order_production_id_foreign` (`order_production_id`),
  KEY `order_production_resources_machine_id_foreign` (`machine_id`),
  CONSTRAINT `order_production_resources_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `order_production_resources_order_production_id_foreign` FOREIGN KEY (`order_production_id`) REFERENCES `order_productions` (`id`),
  CONSTRAINT `order_production_resources_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6244 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_production_type`
--

DROP TABLE IF EXISTS `order_production_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_production_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_productions`
--

DROP TABLE IF EXISTS `order_productions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_productions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `waste` double(8,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `employee_id` int unsigned DEFAULT NULL,
  `order_production_type_id` int unsigned DEFAULT NULL,
  `branch_id` int unsigned DEFAULT NULL,
  `start_date` date NOT NULL,
  `shift` int DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_productions_employee_id_foreign` (`employee_id`),
  KEY `order_productions_order_production_type_id_foreign` (`order_production_type_id`),
  KEY `order_productions_branch_id_foreign` (`branch_id`),
  KEY `order_productions_created_by_id_foreign` (`created_by_id`),
  KEY `order_productions_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `order_productions_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `order_productions_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `order_productions_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `order_productions_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type` (`id`),
  CONSTRAINT `order_productions_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32829 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_request_products`
--

DROP TABLE IF EXISTS `order_request_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_request_products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `kilos` double(8,2) NOT NULL,
  `groups` double(8,2) NOT NULL DEFAULT '0.00',
  `kilo_price` double(8,2) NOT NULL,
  `group_weight` double(8,2) NOT NULL DEFAULT '0.00',
  `product_id` int unsigned DEFAULT NULL,
  `order_request_id` int unsigned DEFAULT NULL,
  `group_price` double(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `order_request_products_product_id_foreign` (`product_id`),
  KEY `order_request_products_order_request_id_foreign` (`order_request_id`),
  CONSTRAINT `order_request_products_order_request_id_foreign` FOREIGN KEY (`order_request_id`) REFERENCES `order_requests` (`id`),
  CONSTRAINT `order_request_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19064 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_request_statuses`
--

DROP TABLE IF EXISTS `order_request_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_request_statuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_requests`
--

DROP TABLE IF EXISTS `order_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_requests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_code` int NOT NULL,
  `active` int NOT NULL DEFAULT '1',
  `date` datetime NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `account_id` int unsigned DEFAULT NULL,
  `order_request_status_id` int unsigned DEFAULT NULL,
  `estimated_delivery_date` datetime DEFAULT NULL,
  `priority` double(8,2) NOT NULL,
  `notes` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_requests_company_id_foreign` (`account_id`),
  KEY `order_requests_order_request_status_id_foreign` (`order_request_status_id`),
  KEY `order_requests_created_by_id_foreign` (`created_by_id`),
  KEY `order_requests_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `order_requests_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `order_requests_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `order_requests_order_request_status_id_foreign` FOREIGN KEY (`order_request_status_id`) REFERENCES `order_request_statuses` (`id`),
  CONSTRAINT `order_requests_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4391 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_sale_products`
--

DROP TABLE IF EXISTS `order_sale_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_sale_products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `kilos` double(8,2) NOT NULL,
  `groups` double(8,2) NOT NULL DEFAULT '0.00',
  `kilo_price` double(8,2) NOT NULL,
  `group_weight` double(8,2) NOT NULL DEFAULT '0.00',
  `product_id` int unsigned DEFAULT NULL,
  `order_sale_id` int unsigned DEFAULT NULL,
  `discount` double(8,2) NOT NULL DEFAULT '0.00',
  `group_price` double(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `order_sale_products_product_id_foreign` (`product_id`),
  KEY `order_sale_products_order_sale_id_foreign` (`order_sale_id`),
  CONSTRAINT `order_sale_products_order_sale_id_foreign` FOREIGN KEY (`order_sale_id`) REFERENCES `order_sales` (`id`),
  CONSTRAINT `order_sale_products_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20077 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_sale_statuses`
--

DROP TABLE IF EXISTS `order_sale_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_sale_statuses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_sales`
--

DROP TABLE IF EXISTS `order_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_sales` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `order_code` int NOT NULL,
  `active` int NOT NULL DEFAULT '1',
  `date` datetime NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `order_sale_status_id` int unsigned DEFAULT NULL,
  `order_request_id` int unsigned DEFAULT NULL,
  `receipt_type_id` int unsigned DEFAULT NULL,
  `invoice_code` int NOT NULL DEFAULT '0',
  `expected_payment_date` datetime DEFAULT NULL,
  `credit_note_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `credit_note_amount` double(12,2) NOT NULL DEFAULT '0.00',
  `require_credit_note` tinyint(1) NOT NULL DEFAULT '0',
  `supplement_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `require_supplement` tinyint(1) NOT NULL DEFAULT '0',
  `notes` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `canceled` tinyint(1) NOT NULL DEFAULT '0',
  `account_id` int unsigned DEFAULT NULL,
  `subtotal` double(12,2) NOT NULL DEFAULT '0.00',
  `tax` double(12,2) NOT NULL DEFAULT '0.00',
  `total_with_tax` double(12,2) NOT NULL DEFAULT '0.00',
  `transfer_receipts_total` double(12,2) NOT NULL DEFAULT '0.00',
  `transfer_receipts_total_no_adjustments` double(12,2) NOT NULL DEFAULT '0.00',
  `automatic_tax_calculation` tinyint(1) NOT NULL DEFAULT '1',
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  `reconciliation_only` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `order_sales_order_sale_status_id_foreign` (`order_sale_status_id`),
  KEY `order_sales_order_request_id_foreign` (`order_request_id`),
  KEY `order_sales_order_sale_receipt_type_id_foreign` (`receipt_type_id`),
  KEY `order_sales_account_id_foreign` (`account_id`),
  KEY `order_sales_created_by_id_foreign` (`created_by_id`),
  KEY `order_sales_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `order_sales_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `order_sales_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `order_sales_order_request_id_foreign` FOREIGN KEY (`order_request_id`) REFERENCES `order_requests` (`id`),
  CONSTRAINT `order_sales_order_sale_status_id_foreign` FOREIGN KEY (`order_sale_status_id`) REFERENCES `order_sale_statuses` (`id`),
  CONSTRAINT `order_sales_receipt_type_foreign` FOREIGN KEY (`receipt_type_id`) REFERENCES `receipt_types` (`id`),
  CONSTRAINT `order_sales_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5861 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payroll_entries`
--

DROP TABLE IF EXISTS `payroll_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `payroll_period_id` int unsigned NOT NULL,
  `employee_id` int unsigned NOT NULL,
  `estatus` varchar(50) NOT NULL DEFAULT 'ALTA',
  `control_bono_area` tinyint(1) NOT NULL DEFAULT '0',
  `control_deposito` tinyint(1) NOT NULL DEFAULT '0',
  `sueldo` float NOT NULL DEFAULT '0',
  `jo` float NOT NULL DEFAULT '48',
  `ht` float NOT NULL DEFAULT '0',
  `he` float NOT NULL DEFAULT '0',
  `he_override` tinyint(1) NOT NULL DEFAULT '0',
  `retardos` int NOT NULL DEFAULT '0',
  `faltas` int NOT NULL DEFAULT '0',
  `vac` float NOT NULL DEFAULT '0',
  `dias_festivos` float NOT NULL DEFAULT '0',
  `infonavit` float NOT NULL DEFAULT '0',
  `fonacot` float NOT NULL DEFAULT '0',
  `descuento_prestamos` float NOT NULL DEFAULT '0',
  `otros_menos` float NOT NULL DEFAULT '0',
  `entregas_especiales` float NOT NULL DEFAULT '0',
  `viajes` float NOT NULL DEFAULT '0',
  `bonos` float NOT NULL DEFAULT '0',
  `otros_mas` float NOT NULL DEFAULT '0',
  `bd` float NOT NULL DEFAULT '0',
  `observaciones` varchar(500) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `payroll_entries_period_id_foreign` (`payroll_period_id`),
  KEY `payroll_entries_employee_id_foreign` (`employee_id`),
  CONSTRAINT `payroll_entries_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `payroll_entries_period_id_foreign` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payroll_periods`
--

DROP TABLE IF EXISTS `payroll_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_periods` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `branch_id` int unsigned DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `week_number` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `payroll_periods_branch_id_foreign` (`branch_id`),
  CONSTRAINT `payroll_periods_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `order_production_type_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_categories_order_production_type_id_foreign` (`order_production_type_id`),
  CONSTRAINT `product_categories_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_materials`
--

DROP TABLE IF EXISTS `product_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_materials` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_plan_row_employees`
--

DROP TABLE IF EXISTS `production_plan_row_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_plan_row_employees` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `production_plan_row_id` int unsigned DEFAULT NULL,
  `employee_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `production_plan_row_employees_row_id_foreign` (`production_plan_row_id`),
  KEY `production_plan_row_employees_employee_id_foreign` (`employee_id`),
  CONSTRAINT `production_plan_row_employees_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `production_plan_row_employees_row_id_foreign` FOREIGN KEY (`production_plan_row_id`) REFERENCES `production_plan_rows` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_plan_rows`
--

DROP TABLE IF EXISTS `production_plan_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_plan_rows` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `production_plan_id` int unsigned DEFAULT NULL,
  `machine_id` int unsigned DEFAULT NULL,
  `product_id` int unsigned DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `position` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `production_plan_rows_production_plan_id_foreign` (`production_plan_id`),
  KEY `production_plan_rows_machine_id_foreign` (`machine_id`),
  KEY `production_plan_rows_product_id_foreign` (`product_id`),
  CONSTRAINT `production_plan_rows_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  CONSTRAINT `production_plan_rows_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `production_plan_rows_production_plan_id_foreign` FOREIGN KEY (`production_plan_id`) REFERENCES `production_plans` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `production_plans`
--

DROP TABLE IF EXISTS `production_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_plans` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `date` datetime NOT NULL,
  `shift` int NOT NULL DEFAULT '1',
  `branch_id` int unsigned DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `product_notes` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `production_plans_branch_id_foreign` (`branch_id`),
  CONSTRAINT `production_plans_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `group_weight_strict` int NOT NULL DEFAULT '0',
  `code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `current_kilo_price` double(8,2) NOT NULL,
  `width` double(8,2) NOT NULL,
  `length` double(8,2) DEFAULT NULL,
  `current_group_weight` double(8,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `calibre` double(8,2) NOT NULL,
  `order_production_type_id` int unsigned DEFAULT NULL,
  `product_material_id` int unsigned DEFAULT NULL,
  `product_category_id` int unsigned DEFAULT NULL,
  `internal_description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `external_description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `discontinued` tinyint(1) NOT NULL DEFAULT '0',
  `current_group_price` double(12,2) NOT NULL DEFAULT '0.00',
  `pleat` double(12,2) DEFAULT NULL,
  `include_units_in_summary` tinyint(1) NOT NULL DEFAULT '1',
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `products_order_production_type_id_foreign` (`order_production_type_id`),
  KEY `product_material_id` (`product_material_id`),
  KEY `product_category_id` (`product_category_id`),
  KEY `products_created_by_id_foreign` (`created_by_id`),
  KEY `products_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `product_category_id` FOREIGN KEY (`product_category_id`) REFERENCES `product_categories` (`id`),
  CONSTRAINT `product_material_id` FOREIGN KEY (`product_material_id`) REFERENCES `product_materials` (`id`),
  CONSTRAINT `products_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `products_order_production_type_id_foreign` FOREIGN KEY (`order_production_type_id`) REFERENCES `order_production_type` (`id`),
  CONSTRAINT `products_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `receipt_types`
--

DROP TABLE IF EXISTS `receipt_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `include_in_accountability_export` tinyint(1) NOT NULL DEFAULT '0',
  `tax_rate` decimal(5,4) NOT NULL DEFAULT '0.0000',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resource_categories`
--

DROP TABLE IF EXISTS `resource_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resource_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resources`
--

DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resources` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `resource_category_id` int unsigned DEFAULT NULL,
  `current_group_price` double(8,2) NOT NULL DEFAULT '0.00',
  `current_unit_price` double(8,2) NOT NULL DEFAULT '0.00',
  `current_group_weight` double(8,2) NOT NULL DEFAULT '0.00',
  `group_weight_strict` double(8,2) NOT NULL DEFAULT '0.00',
  `include_units_in_summary` tinyint(1) NOT NULL DEFAULT '0',
  `unit_price_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `resources_resource_category_id_foreign` (`resource_category_id`),
  KEY `resources_created_by_id_foreign` (`created_by_id`),
  KEY `resources_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `resources_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `resources_resource_category_id_foreign` FOREIGN KEY (`resource_category_id`) REFERENCES `resource_categories` (`id`),
  CONSTRAINT `resources_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spare_categories`
--

DROP TABLE IF EXISTS `spare_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spare_operations`
--

DROP TABLE IF EXISTS `spare_operations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_operations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_adjustment` tinyint NOT NULL DEFAULT '1',
  `is_withdrawal` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spare_transactions`
--

DROP TABLE IF EXISTS `spare_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spare_transactions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `spare_id` int unsigned DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `spare_operation_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spare_transactions_spare_id_foreign` (`spare_id`),
  KEY `spare_transactions_spare_operation_id_foreign` (`spare_operation_id`),
  CONSTRAINT `spare_transactions_spare_id_foreign` FOREIGN KEY (`spare_id`) REFERENCES `spares` (`id`),
  CONSTRAINT `spare_transactions_spare_operation_id_foreign` FOREIGN KEY (`spare_operation_id`) REFERENCES `spare_operations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spares`
--

DROP TABLE IF EXISTS `spares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spares` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `spare_category_id` int unsigned DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `spares_spare_category_id_foreign` (`spare_category_id`),
  CONSTRAINT `spares_spare_category_id_foreign` FOREIGN KEY (`spare_category_id`) REFERENCES `spare_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transfer_receipts`
--

DROP TABLE IF EXISTS `transfer_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_receipts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `amount` double(12,2) NOT NULL,
  `order_sale_id` int unsigned DEFAULT NULL,
  `expense_id` int unsigned DEFAULT NULL,
  `transfer_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transfer_receipts_order_sale_id_foreign` (`order_sale_id`),
  KEY `transfer_receipts_expense_id_foreign` (`expense_id`),
  KEY `transfer_receipts_transfer_id_foreign` (`transfer_id`),
  CONSTRAINT `transfer_receipts_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`),
  CONSTRAINT `transfer_receipts_order_sale_id_foreign` FOREIGN KEY (`order_sale_id`) REFERENCES `order_sales` (`id`),
  CONSTRAINT `transfer_receipts_transfer_id_foreign` FOREIGN KEY (`transfer_id`) REFERENCES `transfers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13432 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transfer_type`
--

DROP TABLE IF EXISTS `transfer_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `from_account_id` int unsigned DEFAULT NULL,
  `to_account_id` int unsigned DEFAULT NULL,
  `expected_date` datetime DEFAULT NULL,
  `transferred` tinyint(1) NOT NULL DEFAULT '0',
  `transferred_date` datetime NOT NULL,
  `amount` double(12,2) NOT NULL,
  `transfer_type_id` int unsigned DEFAULT NULL,
  `notes` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '',
  `created_by_id` int unsigned DEFAULT NULL,
  `updated_by_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transfers_from_account_id_foreign` (`from_account_id`),
  KEY `transfers_to_account_id_foreign` (`to_account_id`),
  KEY `transfers_transfer_type_id_foreign` (`transfer_type_id`),
  KEY `transfers_created_by_id_foreign` (`created_by_id`),
  KEY `transfers_updated_by_id_foreign` (`updated_by_id`),
  CONSTRAINT `transfers_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `transfers_from_account_id_foreign` FOREIGN KEY (`from_account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `transfers_to_account_id_foreign` FOREIGN KEY (`to_account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `transfers_transfer_type_id_foreign` FOREIGN KEY (`transfer_type_id`) REFERENCES `transfer_type` (`id`),
  CONSTRAINT `transfers_updated_by_id_foreign` FOREIGN KEY (`updated_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12241 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_branches`
--

DROP TABLE IF EXISTS `user_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_branches` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `branch_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_branches_user_id_foreign` (`user_id`),
  KEY `user_branches_branch_id_foreign` (`branch_id`),
  CONSTRAINT `user_branches_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `user_branches_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `active` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `role_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_roles_user_id_foreign` (`user_id`),
  KEY `user_roles_role_id_foreign` (`role_id`),
  CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(60) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `active` int NOT NULL DEFAULT '1',
  `remember_token` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `role_id` int unsigned DEFAULT NULL,
  `fullname` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `branch_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_id_foreign` (`role_id`),
  KEY `users_branch_id_foreign` (`branch_id`),
  CONSTRAINT `users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
-- MySQL dump 10.13  Distrib 8.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: inopack_schema_src
-- ------------------------------------------------------
-- Server version	8.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,0,'');
INSERT INTO `migrations` VALUES (2,0,'');
INSERT INTO `migrations` VALUES (3,0,'');
INSERT INTO `migrations` VALUES (4,0,'');
INSERT INTO `migrations` VALUES (5,0,'');
INSERT INTO `migrations` VALUES (6,0,'');
INSERT INTO `migrations` VALUES (7,0,'');
INSERT INTO `migrations` VALUES (8,0,'');
INSERT INTO `migrations` VALUES (9,0,'');
INSERT INTO `migrations` VALUES (10,0,'');
INSERT INTO `migrations` VALUES (11,0,'');
INSERT INTO `migrations` VALUES (12,0,'');
INSERT INTO `migrations` VALUES (13,0,'');
INSERT INTO `migrations` VALUES (14,0,'');
INSERT INTO `migrations` VALUES (15,0,'');
INSERT INTO `migrations` VALUES (16,0,'');
INSERT INTO `migrations` VALUES (17,0,'');
INSERT INTO `migrations` VALUES (18,0,'');
INSERT INTO `migrations` VALUES (19,0,'');
INSERT INTO `migrations` VALUES (20,0,'');
INSERT INTO `migrations` VALUES (21,0,'');
INSERT INTO `migrations` VALUES (22,0,'');
INSERT INTO `migrations` VALUES (23,0,'');
INSERT INTO `migrations` VALUES (24,0,'');
INSERT INTO `migrations` VALUES (25,0,'');
INSERT INTO `migrations` VALUES (26,0,'');
INSERT INTO `migrations` VALUES (27,0,'');
INSERT INTO `migrations` VALUES (28,0,'');
INSERT INTO `migrations` VALUES (29,0,'');
INSERT INTO `migrations` VALUES (30,0,'');
INSERT INTO `migrations` VALUES (31,0,'');
INSERT INTO `migrations` VALUES (32,0,'');
INSERT INTO `migrations` VALUES (33,0,'');
INSERT INTO `migrations` VALUES (34,0,'');
INSERT INTO `migrations` VALUES (35,0,'');
INSERT INTO `migrations` VALUES (36,0,'');
INSERT INTO `migrations` VALUES (37,0,'');
INSERT INTO `migrations` VALUES (38,0,'');
INSERT INTO `migrations` VALUES (39,0,'');
INSERT INTO `migrations` VALUES (40,0,'');
INSERT INTO `migrations` VALUES (41,0,'');
INSERT INTO `migrations` VALUES (42,0,'');
INSERT INTO `migrations` VALUES (43,0,'');
INSERT INTO `migrations` VALUES (44,0,'');
INSERT INTO `migrations` VALUES (45,0,'');
INSERT INTO `migrations` VALUES (46,0,'');
INSERT INTO `migrations` VALUES (47,0,'');
INSERT INTO `migrations` VALUES (48,0,'');
INSERT INTO `migrations` VALUES (49,0,'');
INSERT INTO `migrations` VALUES (50,0,'');
INSERT INTO `migrations` VALUES (51,0,'');
INSERT INTO `migrations` VALUES (52,0,'');
INSERT INTO `migrations` VALUES (53,0,'');
INSERT INTO `migrations` VALUES (54,0,'');
INSERT INTO `migrations` VALUES (55,0,'');
INSERT INTO `migrations` VALUES (56,0,'');
INSERT INTO `migrations` VALUES (57,0,'');
INSERT INTO `migrations` VALUES (58,0,'');
INSERT INTO `migrations` VALUES (59,0,'');
INSERT INTO `migrations` VALUES (60,0,'');
INSERT INTO `migrations` VALUES (61,0,'');
INSERT INTO `migrations` VALUES (62,0,'');
INSERT INTO `migrations` VALUES (63,0,'');
INSERT INTO `migrations` VALUES (64,0,'');
INSERT INTO `migrations` VALUES (65,0,'');
INSERT INTO `migrations` VALUES (66,0,'');
INSERT INTO `migrations` VALUES (67,0,'');
INSERT INTO `migrations` VALUES (68,0,'');
INSERT INTO `migrations` VALUES (69,0,'');
INSERT INTO `migrations` VALUES (70,0,'');
INSERT INTO `migrations` VALUES (71,0,'');
INSERT INTO `migrations` VALUES (72,0,'');
INSERT INTO `migrations` VALUES (73,0,'');
INSERT INTO `migrations` VALUES (74,0,'');
INSERT INTO `migrations` VALUES (75,0,'');
INSERT INTO `migrations` VALUES (76,0,'');
INSERT INTO `migrations` VALUES (77,0,'');
INSERT INTO `migrations` VALUES (78,0,'');
INSERT INTO `migrations` VALUES (79,0,'');
INSERT INTO `migrations` VALUES (80,0,'');
INSERT INTO `migrations` VALUES (81,0,'');
INSERT INTO `migrations` VALUES (82,0,'');
INSERT INTO `migrations` VALUES (83,0,'');
INSERT INTO `migrations` VALUES (84,0,'');
INSERT INTO `migrations` VALUES (85,0,'');
INSERT INTO `migrations` VALUES (86,0,'');
INSERT INTO `migrations` VALUES (87,0,'');
INSERT INTO `migrations` VALUES (88,0,'');
INSERT INTO `migrations` VALUES (89,0,'');
INSERT INTO `migrations` VALUES (90,0,'');
INSERT INTO `migrations` VALUES (91,0,'');
INSERT INTO `migrations` VALUES (92,0,'');
INSERT INTO `migrations` VALUES (93,0,'');
INSERT INTO `migrations` VALUES (94,0,'');
INSERT INTO `migrations` VALUES (95,0,'');
INSERT INTO `migrations` VALUES (96,0,'');
INSERT INTO `migrations` VALUES (97,0,'');
INSERT INTO `migrations` VALUES (98,0,'');
INSERT INTO `migrations` VALUES (99,0,'');
INSERT INTO `migrations` VALUES (100,0,'');
INSERT INTO `migrations` VALUES (101,0,'');
INSERT INTO `migrations` VALUES (102,0,'');
INSERT INTO `migrations` VALUES (103,0,'');
INSERT INTO `migrations` VALUES (104,0,'');
INSERT INTO `migrations` VALUES (105,0,'');
INSERT INTO `migrations` VALUES (106,0,'');
INSERT INTO `migrations` VALUES (107,0,'');
INSERT INTO `migrations` VALUES (108,0,'');
INSERT INTO `migrations` VALUES (109,0,'');
INSERT INTO `migrations` VALUES (110,0,'');
INSERT INTO `migrations` VALUES (111,0,'');
INSERT INTO `migrations` VALUES (112,0,'');
INSERT INTO `migrations` VALUES (113,0,'');
INSERT INTO `migrations` VALUES (114,1616190017017,'MigrationSetup1616190017017');
INSERT INTO `migrations` VALUES (115,1617828692810,'UpdateEmployeesDefaultValues1617828692810');
INSERT INTO `migrations` VALUES (116,1617916527780,'UpdateOrderProductionProductsDefaultValues1617916527780');
INSERT INTO `migrations` VALUES (117,1618001067774,'UpdateOrderAdjustmentProductsDefaultValues1618001067774');
INSERT INTO `migrations` VALUES (118,1618004340467,'UpdateClientsDefaultValues1618004340467');
INSERT INTO `migrations` VALUES (119,1618064683790,'UpdateOrderSalesDefaultValues1618064683790');
INSERT INTO `migrations` VALUES (120,1618249287029,'UpdateOrderRequestProductsDefaultValues1618249287029');
INSERT INTO `migrations` VALUES (121,1618249310143,'UpdateOrderSaleProductsDefaultValues1618249310143');
INSERT INTO `migrations` VALUES (122,1618461782360,'UpdateProductsDefaultValues1618461782360');
INSERT INTO `migrations` VALUES (123,1618615942632,'UpdateProductionEventsDefaultValues1618615942632');
INSERT INTO `migrations` VALUES (124,1618664323117,'UpdateEquipmentsDefaultValues1618664323117');
INSERT INTO `migrations` VALUES (125,1618703128032,'UpdateSuppliersDefaultValues1618703128032');
INSERT INTO `migrations` VALUES (126,1619144345728,'UpdateClientContactsDefaultValues1619144345728');
INSERT INTO `migrations` VALUES (127,1621362854472,'CreateActivitiesTable1621362854472');
INSERT INTO `migrations` VALUES (128,1621449178124,'UpdateCreatedAtAndUpdatedAtFields1621449178124');
INSERT INTO `migrations` VALUES (129,1621564278269,'DropPasswordResets1621564278269');
INSERT INTO `migrations` VALUES (130,1622125030040,'DropPayrollsTables1622125030040');
INSERT INTO `migrations` VALUES (131,1622125740667,'DropDatesTables1622125740667');
INSERT INTO `migrations` VALUES (132,1622125875921,'DropEmployeeTables1622125875921');
INSERT INTO `migrations` VALUES (133,1622126053095,'DropOtherIncomesTable1622126053095');
INSERT INTO `migrations` VALUES (134,1622126090291,'DropProductionIndicatorsTable1622126090291');
INSERT INTO `migrations` VALUES (135,1625063882388,'UpdateExpensesDefaultValues1625063882388');
INSERT INTO `migrations` VALUES (136,1625151801073,'UpdateExpensesWithExpenseCategory1625151801073');
INSERT INTO `migrations` VALUES (137,1628111075002,'CreateEquipmentPhotosTable1628111075002');
INSERT INTO `migrations` VALUES (138,1630163670261,'CreateUserRolesTable1630163670261');
INSERT INTO `migrations` VALUES (139,1630345322657,'CreateUserBranchesTable1630345322657');
INSERT INTO `migrations` VALUES (140,1630355349654,'UpdateActivitiesTableWithRolesAndBranches1630355349654');
INSERT INTO `migrations` VALUES (141,1633993021838,'UpdateMachineWithOrderProductionType1633993021838');
INSERT INTO `migrations` VALUES (142,1633993051198,'UpdateEmployeeWithOrderProductionType1633993051198');
INSERT INTO `migrations` VALUES (143,1634137206319,'UpdateProductsWithProductionType1634137206319');
INSERT INTO `migrations` VALUES (144,1634140995019,'CreateOrderProductionResourcesTable1634140995019');
INSERT INTO `migrations` VALUES (145,1634153263238,'UpdateMaterialsWithOrderProductionType1634153263238');
INSERT INTO `migrations` VALUES (146,1634170744758,'UpdateOrderProductionResourcesWithProductionProducts1634170744758');
INSERT INTO `migrations` VALUES (147,1634176213463,'DropProductionTypeTable1634176213463');
INSERT INTO `migrations` VALUES (148,1642351101001,'DropEquipmentsTables1642351101001');
INSERT INTO `migrations` VALUES (149,1642354417919,'DropExpensesTables1642354417919');
INSERT INTO `migrations` VALUES (150,1642357815486,'DropProductionEventTables1642357815486');
INSERT INTO `migrations` VALUES (151,1642357838685,'DropOrderReturnTables1642357838685');
INSERT INTO `migrations` VALUES (152,1646354693314,'UpdateMaterialsForProductType1646354693314');
INSERT INTO `migrations` VALUES (153,1646421593639,'CreateProductTypeCategoriesTable1646421593639');
INSERT INTO `migrations` VALUES (154,1647553190627,'CreateStartDateColumnInOrderProductions1647553190627');
INSERT INTO `migrations` VALUES (155,1647555333120,'DropDateTimesColumnsInOrderProductions1647555333120');
INSERT INTO `migrations` VALUES (156,1649089114544,'DropPerformanceInOrderProductions1649089114544');
INSERT INTO `migrations` VALUES (157,1649118694617,'DropOrderProductionResources1649118694617');
INSERT INTO `migrations` VALUES (158,1656709123734,'ChangesForGraphql1656709123734');
INSERT INTO `migrations` VALUES (159,1667321960094,'UpdateOrderRequestsWithNotes1667321960094');
INSERT INTO `migrations` VALUES (160,1668704548873,'CreateProductMaterialsAndProductCategoriesTables1668704548873');
INSERT INTO `migrations` VALUES (161,1668805034693,'UpdateProductCategoriesWithOrderProductionType1668805034693');
INSERT INTO `migrations` VALUES (162,1670438976705,'UpdateProductWithExtraFields1670438976705');
INSERT INTO `migrations` VALUES (163,1672275049018,'UpdateOrderSaleProductsWithDiscount1672275049018');
INSERT INTO `migrations` VALUES (164,1673719684388,'DropProductColumns1673719684388');
INSERT INTO `migrations` VALUES (165,1683656394930,'CreateTransfersTable1683656394930');
INSERT INTO `migrations` VALUES (166,1684099036007,'RenameClients1684099036007');
INSERT INTO `migrations` VALUES (167,1684776541931,'CreateExpensesTables1684776541931');
INSERT INTO `migrations` VALUES (168,1684859969971,'CreateAccountTypesTable1684859969971');
INSERT INTO `migrations` VALUES (169,1685560574418,'AlterDateColumnsOnExpensesAndTransfers1685560574418');
INSERT INTO `migrations` VALUES (170,1686009036041,'OrderSalesPatchTables1686009036041');
INSERT INTO `migrations` VALUES (171,1686343667556,'UpdateProductsTableWithGroupPrice1686343667556');
INSERT INTO `migrations` VALUES (172,1686760645229,'UpdateExpensesWithOrderSaleReceiptType1686760645229');
INSERT INTO `migrations` VALUES (173,1688425396557,'UpdateOrderSalesWithAccountability1688425396557');
INSERT INTO `migrations` VALUES (174,1689115118903,'UpdateOrderSalesWithNotes1689115118903');
INSERT INTO `migrations` VALUES (175,1692659193742,'CreateCancelPropertyForSalesAndExpenses1692659193742');
INSERT INTO `migrations` VALUES (176,1695076747401,'UpdateAccountsWithCheckboxes1695076747401');
INSERT INTO `migrations` VALUES (177,1697063226325,'RemoveAccountTypeTable1697063226325');
INSERT INTO `migrations` VALUES (178,1698101151525,'RawMaterialAddition1698101151525');
INSERT INTO `migrations` VALUES (179,1699913198024,'UpdateAddition1699913198024');
INSERT INTO `migrations` VALUES (180,1701207669088,'UpdateOrderSalesWithAccount1701207669088');
INSERT INTO `migrations` VALUES (181,1702576752374,'UpdateTransfersWithSignedInt1702576752374');
INSERT INTO `migrations` VALUES (182,1713377949052,'UpdateOrderAdjustmentsWithOrderSale1713377949052');
INSERT INTO `migrations` VALUES (183,1713545064780,'UpdateTransfersWithTransferType1713545064780');
INSERT INTO `migrations` VALUES (184,1713588955279,'UpdateExpensesWithSubtotal1713588955279');
INSERT INTO `migrations` VALUES (185,1713636191589,'DropExpenseResources1713636191589');
INSERT INTO `migrations` VALUES (186,1713888267857,'UpdateExpensesWithTransfersTotal1713888267857');
INSERT INTO `migrations` VALUES (187,1713992897442,'UpdateOrderSalesWithTotals1713992897442');
INSERT INTO `migrations` VALUES (188,1714499472542,'UpdateOrderProductionProductsWithHours1714499472542');
INSERT INTO `migrations` VALUES (189,1714599064420,'UpdateExpensesWithRequireOrderCode1714599064420');
INSERT INTO `migrations` VALUES (190,1714602444819,'CleanAccountRepeatedSuppliersOne1714602444819');
INSERT INTO `migrations` VALUES (191,1735842356893,'UpdateOrderSalesWithAutomaticTaxCalculation1735842356893');
INSERT INTO `migrations` VALUES (192,1744676018197,'CreateSupplierType1744676018197');
INSERT INTO `migrations` VALUES (193,1751046633324,'UpdateProductionAndEmployees1751046633324');
INSERT INTO `migrations` VALUES (194,1753284496021,'CreateOrderProductionResourcesTable1753284496021');
INSERT INTO `migrations` VALUES (195,1753741386141,'UpdateOrderProductionResourcesWithHours1753741386141');
INSERT INTO `migrations` VALUES (196,1757522259820,'UpdateOrderSalesWithCratedByAndOrderProductionWithMeasurment1757522259820');
INSERT INTO `migrations` VALUES (197,1764102994283,'UpdateExpenseResources1764102994283');
INSERT INTO `migrations` VALUES (198,1764105039622,'CreateExpenseResources1764105039622');
INSERT INTO `migrations` VALUES (199,1764948959077,'UpdateExpensesAndSalesWithIncludeUnitsInSummary1764948959077');
INSERT INTO `migrations` VALUES (200,1765484011264,'UpdateAccountsWithMonitorBalance1765484011264');
INSERT INTO `migrations` VALUES (201,1766086902295,'AddCommentsToTransfers1766086902295');
INSERT INTO `migrations` VALUES (202,1770660152757,'UpdateExpenseResourcesUnitPrice1770660152757');
INSERT INTO `migrations` VALUES (203,1747353600000,'AddExpenseStatuses1747353600000');
INSERT INTO `migrations` VALUES (204,1780625453563,'CreatePayroll1780625453563');
INSERT INTO `migrations` VALUES (205,1781568708185,'UpdateResourcesWithUnitPriceName1781568708185');
INSERT INTO `migrations` VALUES (206,1781887705842,'CreateAccountProducts1781887705842');
INSERT INTO `migrations` VALUES (207,1782578843132,'AddAccountsCreditDaysAndDefaults1782578843132');
INSERT INTO `migrations` VALUES (208,1783622400000,'DropSupplierType1783622400000');
INSERT INTO `migrations` VALUES (209,1783708800000,'AddExcludeFromFinancialSummaries1783708800000');
INSERT INTO `migrations` VALUES (210,1783795200000,'AddAccountabilityExportFlags1783795200000');
INSERT INTO `migrations` VALUES (211,1784073600000,'CreateAccountResources1784073600000');
INSERT INTO `migrations` VALUES (212,1784160000000,'CreateProductionPlans1784160000000');
INSERT INTO `migrations` VALUES (213,1784238440000,'PrefillEmployeeBaseSalaries1784238440000');
INSERT INTO `migrations` VALUES (214,1784240367000,'ReplaceEmployeeStatusWithInactiveFlag1784240367000');
INSERT INTO `migrations` VALUES (215,1784300000000,'AddProductionPlanNotesText1784300000000');
INSERT INTO `migrations` VALUES (216,1784400000000,'AddRecurringExpenses1784400000000');
INSERT INTO `migrations` VALUES (217,1784500000000,'AddCreatedByAndUpdatedByAuditColumns1784500000000');
INSERT INTO `migrations` VALUES (218,1784592000000,'AddTaxRateToReceiptTypes1784592000000');
INSERT INTO `migrations` VALUES (219,1784678400000,'MoveReconciliationOnlyToFinancialDocuments1784678400000');
INSERT INTO `migrations` VALUES (220,1784764800000,'ReconcileDuplicateAccounts1784764800000');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
