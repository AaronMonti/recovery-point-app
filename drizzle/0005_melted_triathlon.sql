ALTER TABLE `pacientes` RENAME COLUMN "nombre_kinesiologo" TO "tipo_paciente";--> statement-breakpoint
ALTER TABLE `pacientes` ADD `obra_social` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_evaluaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text NOT NULL,
	`sesion_id` text NOT NULL,
	`fecha` text NOT NULL,
	`respuestas_comprimidas` text NOT NULL,
	`promedios_comprimidos` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sesion_id`) REFERENCES `sesiones_diarias`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_evaluaciones`("id", "paciente_id", "sesion_id", "fecha", "respuestas_comprimidas", "promedios_comprimidos", "created_at") SELECT "id", "paciente_id", "sesion_id", "fecha", "respuestas_comprimidas", "promedios_comprimidos", "created_at" FROM `evaluaciones`;--> statement-breakpoint
DROP TABLE `evaluaciones`;--> statement-breakpoint
ALTER TABLE `__new_evaluaciones` RENAME TO `evaluaciones`;--> statement-breakpoint
PRAGMA foreign_keys=ON;