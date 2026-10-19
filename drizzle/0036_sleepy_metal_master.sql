DROP INDEX `consumer_leads_phone_hash_idx` ON `consumer_leads`;--> statement-breakpoint
DROP INDEX `consumer_leads_email_hash_idx` ON `consumer_leads`;--> statement-breakpoint
ALTER TABLE `consumer_leads` ADD CONSTRAINT `consumer_leads_phone_hash_unique` UNIQUE(`phone_hash`);--> statement-breakpoint
ALTER TABLE `consumer_leads` ADD CONSTRAINT `consumer_leads_email_hash_unique` UNIQUE(`email_hash`);