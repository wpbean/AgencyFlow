CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text,
	`campaign_recipient_id` text,
	`contact_id` text,
	`edd_customer_id` text,
	`participant_email` text NOT NULL,
	`participant_name` text,
	`subject` text NOT NULL,
	`link_status` text DEFAULT 'UNLINKED' NOT NULL,
	`correlation_method` text DEFAULT 'NONE' NOT NULL,
	`is_unread` integer DEFAULT true NOT NULL,
	`last_message_at` integer NOT NULL,
	`last_message_preview` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`campaign_recipient_id`) REFERENCES `campaign_recipients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`edd_customer_id`) REFERENCES `edd_customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `conversations_campaign_id_idx` ON `conversations` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `conversations_contact_id_idx` ON `conversations` (`contact_id`);--> statement-breakpoint
CREATE INDEX `conversations_participant_email_idx` ON `conversations` (`participant_email`);--> statement-breakpoint
CREATE INDEX `conversations_last_message_at_idx` ON `conversations` (`last_message_at`);--> statement-breakpoint
CREATE INDEX `conversations_is_unread_idx` ON `conversations` (`is_unread`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`direction` text NOT NULL,
	`status` text NOT NULL,
	`from_email` text NOT NULL,
	`from_name` text,
	`to_email` text NOT NULL,
	`subject` text,
	`body_html` text,
	`body_text` text,
	`resend_email_id` text,
	`message_id_header` text,
	`in_reply_to_header` text,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_id_idx` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `messages_resend_email_id_idx` ON `messages` (`resend_email_id`);--> statement-breakpoint
CREATE INDEX `messages_created_at_idx` ON `messages` (`created_at`);