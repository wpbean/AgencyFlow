CREATE TABLE `campaign_events` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`type` text NOT NULL,
	`link` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `campaign_recipients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `campaign_events_campaign_id_idx` ON `campaign_events` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `campaign_events_recipient_id_idx` ON `campaign_events` (`recipient_id`);--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `delivered_at` integer;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `opened_at` integer;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `open_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `clicked_at` integer;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `click_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `bounced_at` integer;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `complained_at` integer;--> statement-breakpoint
ALTER TABLE `campaign_recipients` ADD `unsubscribed_at` integer;--> statement-breakpoint
ALTER TABLE `campaigns` ADD `skipped_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_suppressions` ADD `campaign_id` text REFERENCES campaigns(id);