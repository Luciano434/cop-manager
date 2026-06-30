CREATE TABLE `procedure_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`procedureId` int NOT NULL,
	`revision` varchar(20) NOT NULL DEFAULT 'R00',
	`status` enum('nao_iniciado','em_desenvolvimento','implementado','aprovado','em_revisao','em_elaboracao','bloqueado','cancelado') NOT NULL DEFAULT 'aprovado',
	`sections` text,
	`name` text,
	`description` text,
	`responsible` varchar(255),
	`approvedBy` int,
	`approvedAt` timestamp,
	`lastModifiedBy` int,
	`lastModifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procedure_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `procedures` ADD `revision` varchar(20) DEFAULT 'R00' NOT NULL;--> statement-breakpoint
CREATE INDEX `pr_procedureId_idx` ON `procedure_revisions` (`procedureId`);--> statement-breakpoint
CREATE INDEX `pr_revision_idx` ON `procedure_revisions` (`procedureId`,`revision`);