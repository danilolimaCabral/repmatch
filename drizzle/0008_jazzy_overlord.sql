ALTER TABLE `representatives` ADD `kycStatus` enum('not_started','pending_review','approved','rejected') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycDocumentUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycSelfieUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycDocumentType` enum('rg','cnh','passaporte');--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycExtractedName` varchar(200);--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycExtractedCpf` varchar(20);--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycNotes` text;--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `representatives` ADD `coreNumber` varchar(30);--> statement-breakpoint
ALTER TABLE `representatives` ADD `coreState` varchar(2);--> statement-breakpoint
ALTER TABLE `representatives` ADD `coreStatus` enum('not_checked','active','inactive','not_found') DEFAULT 'not_checked' NOT NULL;--> statement-breakpoint
ALTER TABLE `representatives` ADD `coreValidUntil` varchar(20);--> statement-breakpoint
ALTER TABLE `representatives` ADD `coreCheckedAt` timestamp;