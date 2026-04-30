CREATE TABLE `consent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` enum('terms','privacy','analytics','marketing') NOT NULL,
	`action` enum('granted','revoked') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consent_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_deletion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reason` text,
	`status` enum('pending','processing','completed','rejected') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`processedBy` int,
	`notes` text,
	CONSTRAINT `data_deletion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `resetToken`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `resetTokenExpiry`;