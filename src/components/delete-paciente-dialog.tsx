'use client';

import { deletePatient } from "@/lib/actions";
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

interface DeletePacienteDialogProps {
  paciente: {
    id: string;
    nombre_paciente: string;
  };
  children: React.ReactNode;
}

export function DeletePacienteDialog({ paciente, children }: DeletePacienteDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deletePatient(paciente.id);
      
      if (result.success) {
        toast.success(result.message);
        router.push('/');
        setIsOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error eliminando paciente:", error);
      toast.error("Error al eliminar el paciente");
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
          <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </DialogTitle>
          <DialogDescription className="text-base">
            ¿Estás seguro de que quieres eliminar al paciente?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="font-semibold text-lg">{paciente.nombre_paciente}</p>
            <p className="text-sm text-muted-foreground">
              Esta acción no se puede deshacer y eliminará todas las sesiones asociadas.
            </p>
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
            {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
