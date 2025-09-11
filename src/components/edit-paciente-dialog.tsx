'use client';

import { updatePatient, getCategorias } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Edit, User, UserCheck, Calendar, Save, Loader2, Building, CreditCard, Tag, FileText } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Lista de obras sociales disponibles
const obrasSociales = [
  "OSDE",
  "Swiss Medical",
  "Galeno",
  "Medicus",
  "IOMA",
  "PAMI",
  "OSECAC",
  "OSPMI",
  "Sancor Salud",
  "Otra"
];

interface EditPacienteDialogProps {
  paciente: {
    id: string;
    nombre_paciente: string;
    tipo_paciente: "particular" | "obra_social";
    obra_social?: string | null;
    categoria_id?: string | null;
    nota_lesion?: string | null;
    sesiones_totales: number;
  };
  children: React.ReactNode;
}

function FormFields({ paciente }: { paciente: EditPacienteDialogProps['paciente'] }) {
  const { pending } = useFormStatus();
  const [tipoPaciente, setTipoPaciente] = useState<string>(paciente.tipo_paciente);
  const [categorias, setCategorias] = useState<Array<{id: string, nombre: string, descripcion?: string}>>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      const result = await getCategorias();
      if (result.success && result.data) {
        // Convertir descripcion: null a undefined para cumplir con el tipo esperado
        setCategorias(
          result.data.map(({ id, nombre, descripcion }) => ({
            id,
            nombre,
            descripcion: descripcion ?? undefined,
          }))
        );
      }
    };
    fetchCategorias();
  }, []);
  
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="nombre_paciente" className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Nombre del Paciente
        </Label>
        <Input
          id="nombre_paciente"
          name="nombre_paciente"
          required
          disabled={pending}
          defaultValue={paciente.nombre_paciente}
          placeholder="Ingrese el nombre completo del paciente"
          className="h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tipo_paciente" className="text-sm font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          Tipo de Paciente
        </Label>
        <Select name="tipo_paciente" required disabled={pending} defaultValue={paciente.tipo_paciente} onValueChange={setTipoPaciente}>
          <SelectTrigger className="!h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder="Seleccione el tipo de paciente" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="particular">Particular</SelectItem>
            <SelectItem value="obra_social">Obra Social</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoria_id" className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4 text-purple-600" />
          Categoría
        </Label>
        <Select name="categoria_id" disabled={pending} defaultValue={paciente.categoria_id || "sin-categoria"}>
          <SelectTrigger className="!h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder="Seleccione una categoría (opcional)" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="sin-categoria">Sin categoría</SelectItem>
            {categorias.map((categoria) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nota_lesion" className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-orange-600" />
          Nota sobre la Lesión
        </Label>
        <Textarea
          id="nota_lesion"
          name="nota_lesion"
          disabled={pending}
          defaultValue={paciente.nota_lesion || ""}
          placeholder="Describa el tipo de lesión, síntomas, tratamiento previo, etc. (opcional)"
          className="min-h-[70px] text-base disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
      </div>

      {tipoPaciente === "obra_social" && (
        <div className="space-y-2">
          <Label htmlFor="obra_social" className="text-sm font-medium flex items-center gap-2">
            <Building className="h-4 w-4 text-green-600" />
            Obra Social
          </Label>
          <Select name="obra_social" required disabled={pending} defaultValue={paciente.obra_social || ""}>
            <SelectTrigger className="!h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue placeholder="Seleccione la obra social" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {obrasSociales.map((obraSocial) => (
                <SelectItem key={obraSocial} value={obraSocial}>
                  {obraSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="sesiones_totales" className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          Sesiones Totales
        </Label>
        <Input
          id="sesiones_totales"
          name="sesiones_totales"
          type="number"
          required
          min="1"
          disabled={pending}
          defaultValue={paciente.sesiones_totales}
          placeholder="Ingrese el número total de sesiones programadas"
          className="h-11 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {pending ? "Guardando..." : "Guardar Cambios"}
    </Button>
  );
}

export function EditPacienteDialog({ paciente, children }: EditPacienteDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await updatePatient(paciente.id, formData);
    
    if (result.success) {
      toast.success(result.message);
      // Cerrar el diálogo inmediatamente
      setIsOpen(false);
      // Refrescar la página después de un pequeño delay
      setTimeout(() => {
        router.refresh();
      }, 100);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Edit className="h-5 w-5 text-primary" />
            Editar Paciente
          </DialogTitle>
          <DialogDescription>
            Modifica la información del paciente. Los cambios se guardarán automáticamente.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4">
          <FormFields paciente={paciente} />
          
          <DialogFooter className="gap-2">
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
