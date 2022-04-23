CREATE TABLE `part_categories`
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

CREATE TABLE `parts`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `part_category_id`    int unsigned          DEFAULT NULL,
  `name`   varchar(255)                                               NOT NULL,
  PRIMARY KEY (`id`),
  KEY `parts_part_category_id_foreign` (`part_category_id`),
  CONSTRAINT `parts_part_category_id_foreign` FOREIGN KEY (`part_category_id`) REFERENCES `part_categories` (`id`)
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

CREATE TABLE `machine_components`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `machine_section_id`    int unsigned          DEFAULT NULL,
  `machine_id`    int unsigned          DEFAULT NULL,
  `current_part_id`    int unsigned          DEFAULT NULL,
  `current_part_required_quantity`    int unsigned          DEFAULT NULL,
  `name`   varchar(255)                                               NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_components_machine_section_id_foreign` (`machine_section_id`),
  CONSTRAINT `machine_components_machine_section_id_foreign` FOREIGN KEY (`machine_section_id`) REFERENCES `machine_sections` (`id`),
  KEY `machine_components_machine_id_foreign` (`machine_id`),
  CONSTRAINT `machine_components_machine_id_foreign` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`),
  KEY `machine_components_current_part_id_foreign` (`current_part_id`),
  CONSTRAINT `machine_components_current_part_id_foreign` FOREIGN KEY (`current_part_id`) REFERENCES `parts` (`id`)
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
  `machine_component_id`    int unsigned          DEFAULT NULL,
  `part_id`    int unsigned          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `machine_compatibilities_machine_component_id_foreign` (`machine_component_id`),
  CONSTRAINT `machine_compatibilities_machine_component_id_foreign` FOREIGN KEY (`machine_component_id`) REFERENCES `machine_components` (`id`),
  KEY `machine_compatibilities_part_id_foreign` (`part_id`),
  CONSTRAINT `machine_compatibilities_part_id_foreign` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

CREATE TABLE `part_operations`
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


CREATE TABLE `part_transactions`
(
  `id`           int unsigned                                            NOT NULL AUTO_INCREMENT,
  `active`       int                                                     NOT NULL DEFAULT '1',
  `created_at`   datetime                                               NULL     DEFAULT NULL,
  `updated_at`   datetime                                               NULL     DEFAULT NULL,
  `part_id`    int unsigned          DEFAULT NULL,
  `quantity`    int signed         NOT NULL DEFAULT 0,
  `part_operation_id`    int unsigned          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `part_transactions_part_id_foreign` (`part_id`),
  CONSTRAINT `part_transactions_part_id_foreign` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`),
  KEY `part_transactions_part_operation_id_foreign` (`part_operation_id`),
  CONSTRAINT `part_transactions_part_operation_id_foreign` FOREIGN KEY (`part_operation_id`) REFERENCES `part_operations` (`id`)
) ENGINE = InnoDB
AUTO_INCREMENT = 1
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

            