CREATE TABLE `rep_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`representativeId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`companyName` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rep_reviews_id` PRIMARY KEY(`id`)
);
