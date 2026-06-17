CREATE TABLE `cop_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`status` enum('nao_atendido','parcial','atendido') NOT NULL DEFAULT 'nao_atendido',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cop_requirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `cop_requirements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `evidences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`procedureId` int,
	`operationalStepId` int,
	`copRequirementId` int,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`mimeType` varchar(100),
	`fileSize` decimal(12,0),
	`description` text,
	`uploadedBy` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operational_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`procedureId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`responsible` varchar(255),
	`input` text,
	`output` text,
	`evidenceRequired` boolean NOT NULL DEFAULT true,
	`status` enum('nao_iniciado','em_desenvolvimento','implementado') NOT NULL DEFAULT 'nao_iniciado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procedure_cop_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`procedureId` int NOT NULL,
	`copRequirementId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procedure_cop_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `procedures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` enum('nao_iniciado','em_desenvolvimento','implementado') NOT NULL DEFAULT 'nao_iniciado',
	`responsible` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `procedures_id` PRIMARY KEY(`id`),
	CONSTRAINT `procedures_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `cop_code_idx` ON `cop_requirements` (`code`);--> statement-breakpoint
CREATE INDEX `evidence_procedureId_idx` ON `evidences` (`procedureId`);--> statement-breakpoint
CREATE INDEX `evidence_stepId_idx` ON `evidences` (`operationalStepId`);--> statement-breakpoint
CREATE INDEX `evidence_copId_idx` ON `evidences` (`copRequirementId`);--> statement-breakpoint
CREATE INDEX `procedureId_idx` ON `operational_steps` (`procedureId`);--> statement-breakpoint
CREATE INDEX `link_procedureId_idx` ON `procedure_cop_links` (`procedureId`);--> statement-breakpoint
CREATE INDEX `link_copRequirementId_idx` ON `procedure_cop_links` (`copRequirementId`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `procedures` (`code`);