ALTER TABLE `representatives` ADD `kycFaceMatchScore` decimal(5,4);--> statement-breakpoint
ALTER TABLE `representatives` ADD `kycFaceMatchResult` enum('match','no_match','uncertain','error');