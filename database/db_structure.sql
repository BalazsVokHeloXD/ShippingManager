CREATE DATABASE IF NOT EXISTS `sm`;
USE `sm`;

CREATE TABLE IF NOT EXISTS `admin_login` (
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password` char(60) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `admin_pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_key` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `page_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_key` (`page_key`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `admin_permissions` (
  `admin_username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `page_id` int NOT NULL,
  PRIMARY KEY (`admin_username`,`page_id`),
  KEY `page_id` (`page_id`),
  CONSTRAINT `admin_permissions_ibfk_1` FOREIGN KEY (`admin_username`) REFERENCES `admin_login` (`username`) ON DELETE CASCADE,
  CONSTRAINT `admin_permissions_ibfk_2` FOREIGN KEY (`page_id`) REFERENCES `admin_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `client_login` (
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password` char(60) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `continent` (
  `code` varchar(2) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `country` (
  `iso3` varchar(3) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `continent_code` varchar(2) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`iso3`),
  KEY `continent_code` (`continent_code`),
  CONSTRAINT `country_ibfk_1` FOREIGN KEY (`continent_code`) REFERENCES `continent` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `client` (
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `firstname` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lastname` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `birthplace` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `country_iso3` varchar(3) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `zipcode` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `country_iso3` (`country_iso3`),
  KEY `username` (`username`),
  CONSTRAINT `client_ibfk_1` FOREIGN KEY (`country_iso3`) REFERENCES `country` (`iso3`),
  CONSTRAINT `client_ibfk_2` FOREIGN KEY (`username`) REFERENCES `client_login` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `container_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `price` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `harbor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country_iso3` varchar(3) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `target_container_amount` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_harbor_name` (`name`),
  KEY `country_iso3` (`country_iso3`),
  CONSTRAINT `harbor_ibfk_1` FOREIGN KEY (`country_iso3`) REFERENCES `country` (`iso3`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `container` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `type_id` int NOT NULL,
  `size` enum('small','medium','large') COLLATE utf8mb4_general_ci NOT NULL,
  `harbor_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `type_id` (`type_id`),
  KEY `harbor_id` (`harbor_id`),
  CONSTRAINT `container_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `container_type` (`id`),
  CONSTRAINT `container_ibfk_2` FOREIGN KEY (`harbor_id`) REFERENCES `harbor` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=471 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payment` (
  `id` int NOT NULL,
  `transaction` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` int NOT NULL,
  `status` enum('Pending','Settled','Due','Overdue') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `payment_link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `username` (`username`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`username`) REFERENCES `client_login` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `ship` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `capacity` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `route` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departure_harbor` int DEFAULT NULL,
  `departure_time` datetime NOT NULL,
  `destination_harbor` int DEFAULT NULL,
  `arrival_time` datetime NOT NULL,
  `ship` int DEFAULT NULL,
  `price` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `departure_harbor` (`departure_harbor`),
  KEY `destination_harbor` (`destination_harbor`),
  KEY `ship` (`ship`),
  CONSTRAINT `route_ibfk_1` FOREIGN KEY (`departure_harbor`) REFERENCES `harbor` (`id`),
  CONSTRAINT `route_ibfk_2` FOREIGN KEY (`destination_harbor`) REFERENCES `harbor` (`id`),
  CONSTRAINT `route_ibfk_3` FOREIGN KEY (`ship`) REFERENCES `ship` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `reservation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `route_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `username` (`username`),
  KEY `route_id` (`route_id`),
  CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`username`) REFERENCES `client_login` (`username`),
  CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `route` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=305 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `reservation_container` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `container_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reservation_id` (`reservation_id`),
  KEY `container_id` (`container_id`),
  CONSTRAINT `reservation_container_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`),
  CONSTRAINT `reservation_container_ibfk_2` FOREIGN KEY (`container_id`) REFERENCES `container` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=286 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `reservation_status` (
  `reservation_id` int NOT NULL,
  `status` enum('pending','success','failed') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `error` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`reservation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;