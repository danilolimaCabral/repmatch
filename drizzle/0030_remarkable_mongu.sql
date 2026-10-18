CREATE TABLE `market_lead_accesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan` enum('unlimited_monthly') NOT NULL DEFAULT 'unlimited_monthly',
	`status` enum('pending_payment','pending_approval','active','rejected','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
	`amount` decimal(10,2) NOT NULL,
	`mp_payment_id` varchar(100),
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`starts_at` timestamp,
	`expires_at` timestamp,
	`admin_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `market_lead_accesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `market_access_user_status_expiry_idx` ON `market_lead_accesses` (`user_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `market_access_status_created_idx` ON `market_lead_accesses` (`status`,`created_at`);