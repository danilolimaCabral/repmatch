ALTER TABLE `consumer_leads` MODIFY COLUMN `full_name` varchar(700) NOT NULL;--> statement-breakpoint
ALTER TABLE `consumer_leads` MODIFY COLUMN `phone` varchar(120);--> statement-breakpoint
ALTER TABLE `consumer_leads` MODIFY COLUMN `email` varchar(400);