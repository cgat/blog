CREATE TABLE `image_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`image_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `image_likes_image_fingerprint_idx` ON `image_likes` (`image_id`,`fingerprint`);