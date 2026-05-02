CREATE TABLE `direct_chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`representativeId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`content` text NOT NULL,
	`isReadByCompany` boolean NOT NULL DEFAULT false,
	`isReadByRep` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cnpj_representatives` ADD `created_at` datetime;--> statement-breakpoint
ALTER TABLE `cnpj_representatives` DROP COLUMN `createdAt`;