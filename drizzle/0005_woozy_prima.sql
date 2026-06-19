CREATE TABLE `evidence_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cprCode` varchar(50) NOT NULL,
	`revision` varchar(20) NOT NULL DEFAULT 'R00',
	`requirementId` varchar(50) NOT NULL,
	`status` enum('PENDENTE','OK','NOK','PARCIAL','NA') NOT NULL DEFAULT 'PENDENTE',
	`evidenceText` text,
	`registroText` text,
	`responsible` varchar(255),
	`observacao` text,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ev_cpr_idx` ON `evidence_verifications` (`cprCode`);--> statement-breakpoint
CREATE INDEX `ev_unique_req_idx` ON `evidence_verifications` (`cprCode`,`revision`,`requirementId`);