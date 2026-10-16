CREATE TABLE `request_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`token` text NOT NULL,
	`rounds` text NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`host`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`room` text NOT NULL,
	`session` text NOT NULL,
	`wins` integer NOT NULL,
	`points` integer NOT NULL,
	`assisted` integer NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`room`, `session`),
	FOREIGN KEY (`room`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`session` text NOT NULL,
	`matchup` text NOT NULL,
	`pick` integer NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`session`, `matchup`),
	FOREIGN KEY (`session`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "votes_valid_pick" CHECK("votes"."pick" IN (0,1))
);
--> statement-breakpoint
CREATE INDEX `votes_matchup` ON `votes` (`matchup`);