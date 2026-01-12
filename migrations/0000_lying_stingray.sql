CREATE TABLE `affiliates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referrer_id` integer NOT NULL,
	`referred_id` integer NOT NULL,
	`total_bet_amount` real DEFAULT 0 NOT NULL,
	`total_deposit_amount` real DEFAULT 0 NOT NULL,
	`commission` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bet_type_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bet_type` text NOT NULL,
	`is_enabled` integer DEFAULT 1 NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bet_type_settings_bet_type_unique` ON `bet_type_settings` (`bet_type`);--> statement-breakpoint
CREATE TABLE `bets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`lottery_type` text NOT NULL,
	`bet_type` text NOT NULL,
	`numbers` text NOT NULL,
	`amount` real NOT NULL,
	`potential_win` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`draw_date` text NOT NULL,
	`win_amount` real,
	`matched_number` text,
	`processed_at` integer,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `blocked_numbers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lottery_type` text NOT NULL,
	`number` text NOT NULL,
	`bet_type` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lottery_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lottery_type` text NOT NULL,
	`draw_date` text NOT NULL,
	`first_prize` text,
	`three_digit_top` text,
	`three_digit_bottom` text,
	`two_digit_top` text,
	`two_digit_bottom` text,
	`run_top` text,
	`run_bottom` text,
	`is_processed` integer DEFAULT 0 NOT NULL,
	`processed_at` integer,
	`total_winners` integer,
	`total_payout` real,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payout_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bet_type` text NOT NULL,
	`rate` real NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payout_settings_bet_type_unique` ON `payout_settings` (`bet_type`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`slip_url` text,
	`reference` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`referral_code` text NOT NULL,
	`referred_by` text,
	`affiliate_earnings` real DEFAULT 0 NOT NULL,
	`is_blocked` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);