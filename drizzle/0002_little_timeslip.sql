CREATE TABLE `link_previews` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`description` text,
	`image_url` text,
	`domain` text NOT NULL,
	`scraped_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_previews_url_unique` ON `link_previews` (`url`);