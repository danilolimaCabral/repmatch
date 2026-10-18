CREATE TABLE `platform_settings` (
	`key` varchar(100) NOT NULL,
	`value` varchar(100) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_key` PRIMARY KEY(`key`)
);
