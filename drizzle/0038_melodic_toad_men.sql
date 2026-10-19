ALTER TABLE `saved_market_leads` MODIFY COLUMN `lead_package_order_id` int;--> statement-breakpoint
ALTER TABLE `market_lead_accesses` ADD `selection_limit` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `saved_market_leads` ADD `market_lead_access_id` int;--> statement-breakpoint
CREATE INDEX `saved_market_leads_access_idx` ON `saved_market_leads` (`market_lead_access_id`);