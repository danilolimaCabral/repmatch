CREATE TABLE `lead_package_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`audience` enum('b2b','b2c') NOT NULL,
	`quantity` int NOT NULL DEFAULT 2000,
	`segment` varchar(120),
	`region` varchar(120),
	`notes` text,
	`legalConsent` boolean NOT NULL DEFAULT false,
	`paymentMethod` enum('pix') NOT NULL DEFAULT 'pix',
	`status` enum('pending_payment','pending_approval','approved','rejected','delivered','cancelled') NOT NULL DEFAULT 'pending_payment',
	`totalAmount` decimal(10,2) NOT NULL,
	`mpPaymentId` varchar(100),
	`adminNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_package_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `lead_order_user_created_idx` ON `lead_package_orders` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `lead_order_status_created_idx` ON `lead_package_orders` (`status`,`createdAt`);