'use client';

import { createPaciente } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User, UserCheck, Calendar, Save, X, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

// Lista de nombres de kinesiólogos
const kinesiologos = [
  "Matias Baneiro",
  "Noé Palacios"
];

function FormFields() {
  const { pending } = useFormStatus();
  
  return (
    <div className="space-y-4">
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
          placeholder="Ingrese el nombre completo del paciente"
          className="h-12 text-base shadow-sm border-muted-foreground/20 focus:border-primary/50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="nombre_kinesiologo" className="text-sm font-medium flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-600" />
          Nombre del Kinesiólogo
        </Label>
        <Select name="nombre_kinesiologo" required disabled={pending}>
          <SelectTrigger className="!h-12 text-base shadow-sm border-muted-foreground/20 focus:border-primary/50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder="Seleccione el kinesiólogo responsable" />
          </SelectTrigger>
          <SelectContent className="w-full">
            {kinesiologos.map((kinesiologo) => (
              <SelectItem key={kinesiologo} value={kinesiologo}>
                {kinesiologo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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
          placeholder="Ingrese el número total de sesiones programadas"
          className="h-12 text-base shadow-sm border-muted-foreground/20 focus:border-primary/50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
      className="flex-1 gap-2 h-12 text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {pending ? "Creando..." : "Crear Paciente"}
    </Button>
  );
}

function CancelButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="button" 
      variant="outline" 
      disabled={pending}
      className="gap-2 h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={() => window.history.back()}
    >
      <X className="h-4 w-4" />
      Cancelar
    </Button>
  );
}

export function CreatePacienteForm() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await createPaciente(formData);
    
    if (result.success) {
      toast.success(result.message);
      router.push("/");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <FormFields />
      
      <div className="flex gap-3 pt-4 border-t border-muted-foreground/10">
        <SubmitButton />
        <CancelButton />
      </div>
    </form>
  );
}
