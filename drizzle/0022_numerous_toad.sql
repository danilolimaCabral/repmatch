CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`path` varchar(500) NOT NULL,
	`referrer` varchar(500),
	`userAgent` varchar(500),
	`country` varchar(2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pv_session_idx` ON `page_views` (`sessionId`);--> statement-breakpoint
CREATE INDEX `pv_createdAt_idx` ON `page_views` (`createdAt`);