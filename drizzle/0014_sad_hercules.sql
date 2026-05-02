CREATE TABLE `manager_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`credits` int NOT NULL DEFAULT 0,
	`totalPurchased` int NOT NULL DEFAULT 0,
	`isUnlimited` boolean NOT NULL DEFAULT false,
	`unlimitedExpiresAt` timestamp,
	`stripeCustomerId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manager_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `manager_credits_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `manager_unlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`representativeId` int NOT NULL,
	`stripePaymentId` varchar(100),
	`productKey` varchar(50),
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manager_unlocks_id` PRIMARY KEY(`id`)
);
