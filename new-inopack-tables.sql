
            
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
            