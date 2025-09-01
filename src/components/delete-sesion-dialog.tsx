'use client';

import { deleteSesionDiaria } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteSesionDialogProps {
  sesion: {
    id: string;
    paciente_id: string | null;
    fecha: string;
    hora: string;
    sentimiento: "verde" | "amarillo" | "rojo";
  };
  children: React.ReactNode;
}

export function DeleteSesionDialog({ sesion, children }: DeleteSesionDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete() {
    if (!sesion.paciente_id) {
      toast.error("Error: ID de paciente no válido");
      return;
    }
    
    setIsDeleting(true);
    try {
      const result = await deleteSesionDiaria(sesion.id, sesion.paciente_id);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
        setIsOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error eliminando sesión:", error);
      toast.error("Error al eliminar la sesión");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Sesión
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar esta sesión? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Detalles de la sesión:</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Fecha:</span> {sesion.fecha}</p>
              <p><span className="font-medium">Hora:</span> {sesion.hora}</p>
              <p><span className="font-medium">Estado:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  sesion.sentimiento === "verde" ? "bg-green-500/70" : 
                  sesion.sentimiento === "amarillo" ? "bg-yellow-500/70" : 
                  "bg-red-500/70"
                }`}>
                  {sesion.sentimiento === "verde" && "Verde"}
                  {sesion.sentimiento === "amarillo" && "Amarillo"}
                  {sesion.sentimiento === "rojo" && "Rojo"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            disabled={isDeleting}
            onClick={() => setIsOpen(false)}
            className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            disabled={isDeleting}
            onClick={handleDelete}
            className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "Eliminando..." : "Eliminar Sesión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
