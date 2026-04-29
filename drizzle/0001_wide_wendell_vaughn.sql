CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`representativeId` int NOT NULL,
	`matchScore` int DEFAULT 0,
	`llmScore` int DEFAULT 0,
	`totalScore` int DEFAULT 0,
	`llmAnalysis` text,
	`status` enum('pending','viewed','accepted','rejected','hired') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(100) NOT NULL,
	`cnpj` varchar(20),
	`segment` varchar(100),
	`region` varchar(100),
	`phone` varchar(20),
	`address` text,
	`website` varchar(200),
	`description` text,
	`subscriptionTier` enum('starter','pro','enterprise') NOT NULL DEFAULT 'starter',
	`dynamicRank` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`rankScore` decimal(6,2) DEFAULT '0',
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`cnpjValidated` boolean DEFAULT false,
	`cnpjStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(200),
	`totalRecords` int DEFAULT 0,
	`importedRecords` int DEFAULT 0,
	`failedRecords` int DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorLog` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `import_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	`commissionPercentage` decimal(5,2),
	`region` varchar(100),
	`segment` varchar(100),
	`isFeatured` boolean DEFAULT false,
	`status` enum('open','closed','paused') NOT NULL DEFAULT 'open',
	`minTierRequired` enum('free','premium','elite') NOT NULL DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `representatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(100) NOT NULL,
	`phone` varchar(20),
	`region` varchar(100),
	`segment` varchar(100),
	`experienceYears` int DEFAULT 0,
	`bio` text,
	`subscriptionTier` enum('free','premium','elite') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`responseRate` decimal(5,2) DEFAULT '0',
	`averageRating` decimal(3,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `representatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unlocked_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`representativeId` int NOT NULL,
	`pricePaid` decimal(10,2) NOT NULL,
	`stripePaymentId` varchar(100),
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unlocked_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('representative','company','pending') DEFAULT 'pending' NOT NULL;