ALTER TABLE `procedures` MODIFY COLUMN `status` enum('nao_iniciado','em_desenvolvimento','implementado','aprovado','em_revisao','em_elaboracao','bloqueado','cancelado') NOT NULL DEFAULT 'nao_iniciado';--> statement-breakpoint
ALTER TABLE `procedures` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `procedures` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `procedures` ADD `lastModifiedBy` int;--> statement-breakpoint
ALTER TABLE `procedures` ADD `lastModifiedAt` timestamp;