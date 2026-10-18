CREATE TABLE `market_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_project` varchar(80) NOT NULL,
	`source_org_id` int NOT NULL,
	`source_record_id` int NOT NULL,
	`cnpj` varchar(14) NOT NULL,
	`razao_social` varchar(255) NOT NULL,
	`nome_fantasia` varchar(255),
	`cnae` varchar(20),
	`cnae_descricao` varchar(255),
	`segmento` varchar(150),
	`audience` enum('b2b','b2c','both') NOT NULL,
	`situacao_cadastral` varchar(50) NOT NULL,
	`porte` varchar(60),
	`cidade` varchar(120),
	`estado` char(2),
	`cep` varchar(10),
	`endereco` text,
	`telefone` varchar(50),
	`email` varchar(255),
	`site` varchar(255),
	`instagram` varchar(255),
	`available` boolean NOT NULL DEFAULT true,
	`imported_at` timestamp NOT NULL DEFAULT (now()),
	`source_updated_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `market_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `market_leads_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE INDEX `market_leads_audience_state_idx` ON `market_leads` (`audience`,`estado`,`available`);--> statement-breakpoint
CREATE INDEX `market_leads_segment_idx` ON `market_leads` (`segmento`);--> statement-breakpoint
CREATE INDEX `market_leads_source_record_idx` ON `market_leads` (`source_project`,`source_org_id`,`source_record_id`);