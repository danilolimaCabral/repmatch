CREATE TABLE `unlock_request_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unlockRequestId` int NOT NULL,
	`representativeId` int NOT NULL,
	`repName` varchar(100),
	`priceUnit` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unlock_request_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `unlock_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`paymentMethod` enum('pix','stripe') NOT NULL DEFAULT 'pix',
	`status` enum('pending_payment','pending_approval','approved','rejected','cancelled') NOT NULL DEFAULT 'pending_payment',
	`totalAmount` decimal(10,2) NOT NULL,
	`pixProofUrl` varchar(500),
	`pixProofKey` varchar(200),
	`stripePaymentId` varchar(100),
	`adminNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unlock_requests_id` PRIMARY KEY(`id`)
);
