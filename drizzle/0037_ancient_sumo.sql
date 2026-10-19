CREATE TABLE `representative_monthly_accesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int NOT NULL,
	`user_id` int NOT NULL,
	`status` enum('pending_payment','pending_approval','active','rejected','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
	`amount` decimal(10,2) NOT NULL,
	`unlock_limit` int NOT NULL DEFAULT 100,
	`mp_payment_id` varchar(100),
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`starts_at` timestamp,
	`expires_at` timestamp,
	`admin_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `representative_monthly_accesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `representative_monthly_unlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`representative_monthly_access_id` int NOT NULL,
	`company_id` int NOT NULL,
	`representative_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `representative_monthly_unlocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `rep_monthly_unlock_access_rep_unique` UNIQUE(`representative_monthly_access_id`,`representative_id`)
);
--> statement-breakpoint
ALTER TABLE `consumer_lead_accesses` ADD `selection_limit` int DEFAULT 500 NOT NULL;--> statement-breakpoint
CREATE INDEX `rep_monthly_access_company_status_expiry_idx` ON `representative_monthly_accesses` (`company_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `rep_monthly_access_user_status_expiry_idx` ON `representative_monthly_accesses` (`user_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `rep_monthly_access_status_created_idx` ON `representative_monthly_accesses` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `rep_monthly_unlock_access_created_idx` ON `representative_monthly_unlocks` (`representative_monthly_access_id`,`created_at`);