CREATE TABLE `consumer_lead_accesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
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
	CONSTRAINT `consumer_lead_accesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consumer_lead_import_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_label` varchar(120) NOT NULL,
	`file_sha256` char(64) NOT NULL,
	`consent_attested` boolean NOT NULL DEFAULT false,
	`consent_policy_version` varchar(60) NOT NULL,
	`total_rows` int NOT NULL DEFAULT 0,
	`accepted_rows` int NOT NULL DEFAULT 0,
	`duplicate_rows` int NOT NULL DEFAULT 0,
	`rejected_rows` int NOT NULL DEFAULT 0,
	`imported_by` int,
	`status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consumer_lead_import_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `consumer_lead_import_batches_file_sha256_unique` UNIQUE(`file_sha256`)
);
--> statement-breakpoint
CREATE TABLE `consumer_lead_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`quantity` int NOT NULL,
	`legal_consent` boolean NOT NULL DEFAULT false,
	`payment_method` enum('pix') NOT NULL DEFAULT 'pix',
	`status` enum('pending_payment','pending_approval','approved','rejected','delivered','cancelled') NOT NULL DEFAULT 'pending_payment',
	`total_amount` decimal(10,2) NOT NULL,
	`mp_payment_id` varchar(100),
	`admin_notes` text,
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`delivered_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consumer_lead_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consumer_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`import_batch_id` int NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`email` varchar(255),
	`phone_hash` char(64),
	`email_hash` char(64),
	`contact_key` char(64) NOT NULL,
	`consent_status` enum('declared','revoked') NOT NULL DEFAULT 'declared',
	`available` boolean NOT NULL DEFAULT true,
	`consent_declared_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consumer_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `consumer_leads_contact_key_unique` UNIQUE(`contact_key`)
);
--> statement-breakpoint
CREATE TABLE `saved_consumer_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`consumer_lead_order_id` int,
	`consumer_lead_access_id` int,
	`consumer_lead_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_consumer_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_consumer_leads_user_lead_unique` UNIQUE(`user_id`,`consumer_lead_id`)
);
--> statement-breakpoint
CREATE INDEX `consumer_lead_access_user_status_expiry_idx` ON `consumer_lead_accesses` (`user_id`,`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `consumer_lead_access_status_created_idx` ON `consumer_lead_accesses` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `consumer_lead_order_user_created_idx` ON `consumer_lead_orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `consumer_lead_order_status_created_idx` ON `consumer_lead_orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `consumer_leads_phone_hash_idx` ON `consumer_leads` (`phone_hash`);--> statement-breakpoint
CREATE INDEX `consumer_leads_email_hash_idx` ON `consumer_leads` (`email_hash`);--> statement-breakpoint
CREATE INDEX `consumer_leads_available_consent_idx` ON `consumer_leads` (`available`,`consent_status`);--> statement-breakpoint
CREATE INDEX `consumer_leads_batch_idx` ON `consumer_leads` (`import_batch_id`);--> statement-breakpoint
CREATE INDEX `saved_consumer_leads_user_created_idx` ON `saved_consumer_leads` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `saved_consumer_leads_order_idx` ON `saved_consumer_leads` (`consumer_lead_order_id`);--> statement-breakpoint
CREATE INDEX `saved_consumer_leads_access_idx` ON `saved_consumer_leads` (`consumer_lead_access_id`);