CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`task_id` text,
	`type` text NOT NULL,
	`source` text NOT NULL,
	`metadata` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_student_id_idx` ON `events` (`student_id`);--> statement-breakpoint
CREATE INDEX `events_task_id_idx` ON `events` (`task_id`);--> statement-breakpoint
CREATE INDEX `events_created_at_idx` ON `events` (`created_at`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`task_id` text,
	`dimension` text NOT NULL,
	`rule_id` text NOT NULL,
	`summary` text NOT NULL,
	`supporting_event_ids` text NOT NULL,
	`strength` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `evidence_student_id_idx` ON `evidence` (`student_id`);--> statement-breakpoint
CREATE INDEX `evidence_dimension_idx` ON `evidence` (`dimension`);--> statement-breakpoint
CREATE TABLE `missions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`student_id` text NOT NULL,
	`instruction` text NOT NULL,
	`dimensions` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`role` text NOT NULL,
	`class_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
