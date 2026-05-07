CREATE INDEX `app_jobId_idx` ON `applications` (`jobId`);--> statement-breakpoint
CREATE INDEX `app_repId_idx` ON `applications` (`representativeId`);--> statement-breakpoint
CREATE INDEX `company_userId_idx` ON `companies` (`userId`);--> statement-breakpoint
CREATE INDEX `dchat_company_rep_idx` ON `direct_chat_messages` (`companyId`,`representativeId`);--> statement-breakpoint
CREATE INDEX `dchat_sender_idx` ON `direct_chat_messages` (`senderUserId`);--> statement-breakpoint
CREATE INDEX `job_companyId_idx` ON `jobs` (`companyId`);--> statement-breakpoint
CREATE INDEX `job_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `job_region_segment_idx` ON `jobs` (`region`,`segment`);--> statement-breakpoint
CREATE INDEX `msg_applicationId_idx` ON `messages` (`applicationId`);--> statement-breakpoint
CREATE INDEX `rep_userId_idx` ON `representatives` (`userId`);--> statement-breakpoint
CREATE INDEX `rep_kycStatus_idx` ON `representatives` (`kycStatus`);--> statement-breakpoint
CREATE INDEX `rep_region_segment_idx` ON `representatives` (`region`,`segment`);