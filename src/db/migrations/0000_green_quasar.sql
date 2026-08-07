CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_agency_id_idx` ON `activities` (`agency_id`);--> statement-breakpoint
CREATE INDEX `activities_created_at_idx` ON `activities` (`created_at`);--> statement-breakpoint
CREATE TABLE `agencies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`country` text,
	`city` text,
	`timezone` text,
	`company_size` text,
	`description` text,
	`services` text DEFAULT '[]',
	`technologies` text DEFAULT '[]',
	`source` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`lead_score` integer DEFAULT 0 NOT NULL,
	`lead_score_override` integer,
	`priority` text DEFAULT 'MEDIUM' NOT NULL,
	`notes` text,
	`last_contact_at` integer,
	`next_follow_up_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agencies_status_idx` ON `agencies` (`status`);--> statement-breakpoint
CREATE INDEX `agencies_country_idx` ON `agencies` (`country`);--> statement-breakpoint
CREATE INDEX `agencies_website_idx` ON `agencies` (`website`);--> statement-breakpoint
CREATE INDEX `agencies_lead_score_idx` ON `agencies` (`lead_score`);--> statement-breakpoint
CREATE INDEX `agencies_created_at_idx` ON `agencies` (`created_at`);--> statement-breakpoint
CREATE INDEX `agencies_priority_idx` ON `agencies` (`priority`);--> statement-breakpoint
CREATE INDEX `agencies_source_idx` ON `agencies` (`source`);--> statement-breakpoint
CREATE TABLE `agency_tags` (
	`agency_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`agency_id`, `tag_id`),
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agency_tags_tag_id_idx` ON `agency_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text,
	`email` text,
	`phone` text,
	`job_title` text,
	`linkedin_url` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contacts_agency_id_idx` ON `contacts` (`agency_id`);--> statement-breakpoint
CREATE INDEX `contacts_email_idx` ON `contacts` (`email`);--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'GENERAL' NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`contact_id` text,
	`outreach_id` text,
	`template_id` text,
	`type` text DEFAULT 'FOLLOW_UP_1' NOT NULL,
	`due_date` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`completed_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`outreach_id`) REFERENCES `outreach`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `follow_ups_due_date_idx` ON `follow_ups` (`due_date`);--> statement-breakpoint
CREATE INDEX `follow_ups_status_idx` ON `follow_ups` (`status`);--> statement-breakpoint
CREATE INDEX `follow_ups_agency_id_idx` ON `follow_ups` (`agency_id`);--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`contact_id` text,
	`title` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'PROJECT' NOT NULL,
	`stage` text DEFAULT 'INTERESTED' NOT NULL,
	`expected_rate` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`expected_hours` real,
	`probability` integer DEFAULT 50 NOT NULL,
	`next_action` text,
	`next_action_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `opportunities_stage_idx` ON `opportunities` (`stage`);--> statement-breakpoint
CREATE INDEX `opportunities_agency_id_idx` ON `opportunities` (`agency_id`);--> statement-breakpoint
CREATE TABLE `outreach` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`contact_id` text,
	`template_id` text,
	`type` text DEFAULT 'INITIAL' NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`sent_at` integer,
	`scheduled_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `outreach_agency_id_idx` ON `outreach` (`agency_id`);--> statement-breakpoint
CREATE INDEX `outreach_sent_at_idx` ON `outreach` (`sent_at`);--> statement-breakpoint
CREATE INDEX `outreach_status_idx` ON `outreach` (`status`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`agency_id` text NOT NULL,
	`opportunity_id` text,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`hourly_rate` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`estimated_hours` real,
	`actual_hours` real,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `projects_agency_id_idx` ON `projects` (`agency_id`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'gray' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);