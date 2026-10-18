CREATE TABLE `representative_purchase_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`representativeId` int NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'search',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `representative_purchase_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `rpc_rep_created_idx` ON `representative_purchase_clicks` (`representativeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `rpc_company_created_idx` ON `representative_purchase_clicks` (`companyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `rpc_created_idx` ON `representative_purchase_clicks` (`createdAt`);