ALTER TABLE `applications` ADD `contactUnlocked` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `mpPaymentId` varchar(100);--> statement-breakpoint
ALTER TABLE `applications` ADD `applicationFee` int DEFAULT 0;