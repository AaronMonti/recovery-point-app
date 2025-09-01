'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditSesionForm } from "./edit-sesion-form";
import { useState } from "react";

interface EditSesionDialogProps {
  sesion: {
    id: string;
    paciente_id: string | null;
    fecha: string;
    hora: string;
    sentimiento: "verde" | "amarillo" | "rojo";
  };
  children: React.ReactNode;
}

export function EditSesionDialog({ sesion, children }: EditSesionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Editar Sesión</span>
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles de la sesión del {sesion.fecha} a las {sesion.hora}
          </DialogDescription>
        </DialogHeader>
        
        <EditSesionForm 
          sesion={sesion} 
          onClose={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
