CREATE TABLE `blog_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(200) NOT NULL,
	`reaction` enum('like','love','rocket','bulb') NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `br_slug_reaction_idx` ON `blog_reactions` (`slug`,`reaction`);--> statement-breakpoint
CREATE INDEX `br_session_slug_idx` ON `blog_reactions` (`sessionId`,`slug`);