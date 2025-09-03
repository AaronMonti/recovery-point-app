CREATE TABLE `evaluaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text,
	`sesion_id` text,
	`fecha` text NOT NULL,
	`respuestas_comprimidas` text NOT NULL,
	`promedios_comprimidos` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sesion_id`) REFERENCES `sesiones_diarias`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `evaluaciones_diarias`;