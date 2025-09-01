CREATE TABLE `pacientes` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre_paciente` text NOT NULL,
	`nombre_kinesiologo` text NOT NULL,
	`sesiones_totales` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sesiones_diarias` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text,
	`fecha` text NOT NULL,
	`hora` text NOT NULL,
	`sentimiento` text NOT NULL,
	FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON UPDATE no action ON DELETE no action
);
