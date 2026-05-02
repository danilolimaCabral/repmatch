CREATE TABLE `managers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(100) NOT NULL,
	`cpf` varchar(20),
	`phone` varchar(20),
	`region` varchar(100),
	`segment` varchar(100),
	`teamSize` int DEFAULT 0,
	`bio` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `managers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rep_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`representativeId` int NOT NULL,
	`title` varchar(150) NOT NULL,
	`description` text,
	`region` varchar(100),
	`segment` varchar(100),
	`availability` enum('imediata','30dias','60dias','negociavel') DEFAULT 'imediata',
	`workModel` enum('exclusivo','multiplas','indifferente') DEFAULT 'multiplas',
	`expectedCommission` varchar(50),
	`status` enum('active','paused','closed') NOT NULL DEFAULT 'active',
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rep_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `userType` enum('representative','company','manager','pending') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `representatives` ADD `cnpj` varchar(20);--> statement-breakpoint
ALTER TABLE `representatives` ADD `coreDocUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(20);