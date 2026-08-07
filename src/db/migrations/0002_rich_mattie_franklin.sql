CREATE TABLE `edd_customer_products` (
	`edd_customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	PRIMARY KEY(`edd_customer_id`, `product_id`),
	FOREIGN KEY (`edd_customer_id`) REFERENCES `edd_customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `edd_products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `edd_customer_products_product_id_idx` ON `edd_customer_products` (`product_id`);--> statement-breakpoint
CREATE TABLE `edd_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`edd_customer_id` integer NOT NULL,
	`contact_id` text,
	`first_name` text,
	`last_name` text,
	`email` text NOT NULL,
	`purchase_count` integer DEFAULT 0 NOT NULL,
	`purchase_value` real DEFAULT 0 NOT NULL,
	`date_created` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `edd_customers_edd_customer_id_unique` ON `edd_customers` (`edd_customer_id`);--> statement-breakpoint
CREATE INDEX `edd_customers_email_idx` ON `edd_customers` (`email`);--> statement-breakpoint
CREATE INDEX `edd_customers_contact_id_idx` ON `edd_customers` (`contact_id`);--> statement-breakpoint
CREATE TABLE `edd_integration` (
	`id` text PRIMARY KEY NOT NULL,
	`site_url` text,
	`api_key` text,
	`api_token` text,
	`connected` integer DEFAULT false NOT NULL,
	`sync_status` text DEFAULT 'idle' NOT NULL,
	`sync_error` text,
	`last_synced_at` integer,
	`last_sync_stats` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `edd_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` real,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
