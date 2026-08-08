CREATE TABLE `message_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`filename` text,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`content_id` text,
	`is_inline` integer DEFAULT false NOT NULL,
	`storage_path` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `message_attachments_message_id_idx` ON `message_attachments` (`message_id`);