"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";
import { deleteObraSocial } from "@/lib/actions";
import { toast } from "sonner";

interface DeleteObraSocialDialogProps {
  obraSocial: {
    id: string;
    nombre: string;
    descripcion: string | null;
    created_at: string | null;
  };
}

export function DeleteObraSocialDialog({ obraSocial }: DeleteObraSocialDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);

    try {
      const result = await deleteObraSocial(obraSocial.id);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Error al eliminar la obra social");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
        <Trash2 className="group-hover/btn:scale-110 transition-transform" />

          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Obra Social</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar la obra social &quot;{obraSocial.nombre}&quot;?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  Advertencia
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Si hay pacientes asignados a esta obra social, no podrás eliminarla.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="group-hover/btn:scale-110 transition-transform" />
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
