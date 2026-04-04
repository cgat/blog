CREATE TABLE `guestbook_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`content` text NOT NULL,
	`fingerprint` text NOT NULL,
	`created_at` integer NOT NULL
);
