CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_name` text NOT NULL,
	`retell_agent_id` text NOT NULL,
	`booking_provider` text DEFAULT 'square' NOT NULL,
	`square_merchant_id` text,
	`square_location_id` text,
	`square_access_token` text,
	`square_refresh_token` text,
	`square_token_expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_retell_agent_id_unique` ON `clients` (`retell_agent_id`);