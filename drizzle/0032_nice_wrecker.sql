CREATE TABLE `saved_market_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`lead_package_order_id` int NOT NULL,
	`market_lead_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_market_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_market_leads_user_lead_unique` UNIQUE(`user_id`,`market_lead_id`)
);
--> statement-breakpoint
CREATE INDEX `saved_market_leads_user_created_idx` ON `saved_market_leads` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `saved_market_leads_order_idx` ON `saved_market_leads` (`lead_package_order_id`);