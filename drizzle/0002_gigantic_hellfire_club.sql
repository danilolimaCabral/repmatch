ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;