CREATE TABLE `evaluaciones_diarias` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text,
	`fecha` text NOT NULL,
	`respuestas` text NOT NULL,
	`promedios` text NOT NULL,
	`minutos_sesion` integer,
	`created_at` text,
	FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON UPDATE no action ON DELETE no action
);
