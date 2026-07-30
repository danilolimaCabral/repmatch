ALTER TABLE `representatives` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `representatives` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `representatives` ADD `nomeFantasia` varchar(255);--> statement-breakpoint
ALTER TABLE `representatives` ADD `cidade` varchar(100);--> statement-breakpoint
ALTER TABLE `representatives` ADD `estado` varchar(2);--> statement-breakpoint
ALTER TABLE `representatives` ADD `cep` varchar(10);--> statement-breakpoint
ALTER TABLE `representatives` ADD `situacaoCadastral` varchar(50);--> statement-breakpoint
ALTER TABLE `representatives` ADD `dataAbertura` varchar(20);--> statement-breakpoint
ALTER TABLE `representatives` ADD `naturezaJuridica` varchar(200);--> statement-breakpoint
ALTER TABLE `representatives` ADD `porte` varchar(50);--> statement-breakpoint
ALTER TABLE `representatives` ADD `capitalSocial` varchar(30);--> statement-breakpoint
ALTER TABLE `representatives` ADD `simplesNacional` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `representatives` ADD `mei` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `representatives` ADD `cnaeDescricao` varchar(300);--> statement-breakpoint
ALTER TABLE `representatives` ADD `socios` text;--> statement-breakpoint
ALTER TABLE `representatives` ADD `cnpjaRawJson` text;--> statement-breakpoint
ALTER TABLE `representatives` ADD `cnpjaUpdatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `unlock_requests` ADD `inactiveCount` int DEFAULT 0;