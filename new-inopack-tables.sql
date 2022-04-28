CREATE TABLE `spare_categories`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `name`   varchar(255)                                               NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `spares`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `spare_category_id`    int unsigned          DEFAULT NULL,
  `name`   varchar(255)                                               NOT NULL,
  PRIMARY KEY (`id`),
  KEY `spares_spare_category_id_foreign` (`spare_category_id`),
  CONSTRAINT `spares_spare_category_id_foreign` FOREIGN KEY (`spare_category_id`) REFERENCES `spare_categories` (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `machine_sections`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `machine_id`    int unsigned          DEFAULT NULL,
  `name`   varchar(255)                                               NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_sections_machine_id_foreign` (`machine_id`),
  CONSTRAINT `machine_sections_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `machine_parts`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `machine_section_id`    int unsigned          DEFAULT NULL,
  `machine_id`    int unsigned          DEFAULT NULL,
  `current_spare_id`    int unsigned          DEFAULT NULL,
  `current_spare_required_quantity`    int unsigned          DEFAULT NULL,
  `name`   varchar(255)                                               NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_parts_machine_section_id_foreign` (`machine_section_id`),
  CONSTRAINT `machine_parts_machine_section_id_foreign` FOREIGN KEY (`machine_section_id`) REFERENCES `machine_sections` (`id`),
  KEY `machine_parts_machine_id_foreign` (`machine_id`),
  CONSTRAINT `machine_parts_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  KEY `machine_parts_current_spare_id_foreign` (`current_spare_id`),
  CONSTRAINT `machine_parts_current_spare_id_foreign` FOREIGN KEY (`current_spare_id`) REFERENCES `spares` (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `machine_compatibilities`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `machine_part_id`    int unsigned          DEFAULT NULL,
  `spare_id`    int unsigned          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_compatibilities_machine_part_id_foreign` (`machine_part_id`),
  CONSTRAINT `machine_compatibilities_machine_part_id_foreign` FOREIGN KEY (`machine_part_id`) REFERENCES `machine_parts` (`id`),
  KEY `machine_compatibilities_spare_id_foreign` (`spare_id`),
  CONSTRAINT `machine_compatibilities_spare_id_foreign` FOREIGN KEY (`spare_id`) REFERENCES `spares` (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `spare_operations`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `date`   datetime                                               NULL     DEFAULT NULL,
  `description`   varchar(255)                                               NOT NULL,
  `is_adjustment`       tinyint                                                     NOT NULL DEFAULT 1,
  `is_withdrawal`       tinyint                                                     NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


CREATE TABLE `spare_transactions`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `spare_id`    int unsigned          DEFAULT NULL,
  `quantity`    int signed         NOT NULL DEFAULT 0,
  `spare_operation_id`    int unsigned          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `spare_transactions_spare_id_foreign` (`spare_id`),
  CONSTRAINT `spare_transactions_spare_id_foreign` FOREIGN KEY (`spare_id`) REFERENCES `spares` (`id`),
  KEY `spare_transactions_spare_operation_id_foreign` (`spare_operation_id`),
  CONSTRAINT `spare_transactions_spare_operation_id_foreign` FOREIGN KEY (`spare_operation_id`) REFERENCES `spare_operations` (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

            