ALTER TABLE `representatives` ADD `availability` enum('imediata','30dias','60dias','negociavel') DEFAULT 'negociavel';--> statement-breakpoint
ALTER TABLE `representatives` ADD `workModel` enum('exclusivo','multiplas','indifferente') DEFAULT 'multiplas';--> statement-breakpoint
ALTER TABLE `representatives` ADD `portfolioSize` varchar(50);--> statement-breakpoint
ALTER TABLE `representatives` ADD `linkedinUrl` varchar(300);--> statement-breakpoint
ALTER TABLE `representatives` ADD `avatarUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `representatives` ADD `cities` text;--> statement-breakpoint
ALTER TABLE `representatives` ADD `additionalSegments` text;--> statement-breakpoint
ALTER TABLE `representatives` ADD `highlightedAt` timestamp;