'use client';

import { createSesionDiaria } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Heart, Smile, Meh, Frown, Save, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";

interface CreateSesionFormProps {
  pacienteId: string;
}

function SentimientosSelector({ selectedSentimiento, onSentimientoChange }: { 
  selectedSentimiento: string; 
  onSentimientoChange: (value: string) => void;
}) {
  const { pending } = useFormStatus();

  const sentimientos = [
    {
      value: "verde",
      label: "Verde - Me siento bien",
      icon: Smile,
      className: "border-green-200 bg-green-50 hover:bg-green-100 data-[state=on]:bg-green-300 data-[state=on]:border-green-300",
      iconClassName: "text-green-600",
      textClassName: "text-green-700"
    },
    {
      value: "amarillo",
      label: "Amarillo - Me siento regular",
      icon: Meh,
      className: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100 data-[state=on]:bg-yellow-100 data-[state=on]:border-yellow-300",
      iconClassName: "text-yellow-600",
      textClassName: "text-yellow-700"
    },
    {
      value: "rojo",
      label: "Rojo - Me siento mal",
      icon: Frown,
      className: "border-red-200 bg-red-50 hover:bg-red-100 data-[state=on]:bg-red-100 data-[state=on]:border-red-300",
      iconClassName: "text-red-600",
      textClassName: "text-red-700"
    }
  ];

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500" />
        ¿Que color elige hoy?
      </Label>
      <div className="flex gap-6 justify-center">
        {sentimientos.map((s) => {
          const IconComponent = s.icon;
          const isSelected = selectedSentimiento === s.value;

          // Colores más vivos
          const colorStyles: Record<string, string> = {
            verde: "bg-green-500 border-green-700 hover:bg-green-600",
            amarillo: "bg-yellow-400 border-yellow-600 hover:bg-yellow-500",
            rojo: "bg-red-500 border-red-700 hover:bg-red-600",
          };

          return (
            <button
              key={s.value}
              type="button"
              disabled={pending}
              onClick={() => onSentimientoChange(s.value)}
              className={`
                w-16 h-16 flex items-center justify-center rounded-full border-2 transition-all
                ${isSelected ? "scale-110 ring-4 ring-offset-2 ring-muted shadow-lg" : ""}
                ${colorStyles[s.value]}
                ${pending ? "opacity-50 cursor-not-allowed" : ""}
              `}
              aria-label={s.label}
            >
              <IconComponent className="h-7 w-7 text-white" />
            </button>
          );
        })}
      </div>

      <p className="text-center mt-3 font-medium text-muted-foreground">
        {sentimientos.find(s => s.value === selectedSentimiento)?.label}
      </p>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full gap-2 h-12 text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {pending ? "Registrando..." : "Registrar Sesión"}
    </Button>
  );
}

export function CreateSesionForm({ pacienteId }: CreateSesionFormProps) {
  const router = useRouter();
  const [selectedSentimiento, setSelectedSentimiento] = useState<string>("verde");
  const [currentDateTime, setCurrentDateTime] = useState<string>("");

  // Actualizar la fecha y hora actual cada segundo
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dia = now.getDate().toString().padStart(2, '0');
      const mes = (now.getMonth() + 1).toString().padStart(2, '0');
      const año = now.getFullYear();
      const horas = now.getHours().toString().padStart(2, '0');
      const minutos = now.getMinutes().toString().padStart(2, '0');
      const segundos = now.getSeconds().toString().padStart(2, '0');
      
      setCurrentDateTime(`${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`);
    };

    updateDateTime(); // Actualizar inmediatamente
    const interval = setInterval(updateDateTime, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(formData: FormData) {
    // Capturar la fecha y hora actual del dispositivo
    const now = new Date();
    const dia = now.getDate().toString().padStart(2, '0');
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    const año = now.getFullYear();
    const horas = now.getHours().toString().padStart(2, '0');
    const minutos = now.getMinutes().toString().padStart(2, '0');
    
    formData.append("paciente_id", pacienteId);
    formData.append("sentimiento", selectedSentimiento);
    formData.append("fecha_local", `${dia}-${mes}-${año}`);
    formData.append("hora_local", `${horas}:${minutos}`);
    
    const result = await createSesionDiaria(formData);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
      
      // Disparar evento para actualizar el estado de evaluaciones
      window.dispatchEvent(new CustomEvent('evaluationStatusUpdate'));
    } else {
      toast.error(result.message);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <SentimientosSelector 
          selectedSentimiento={selectedSentimiento}
          onSentimientoChange={setSelectedSentimiento}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Calendar className="h-4 w-4" />
          <span>La sesión se registrará automáticamente con la fecha y hora actual</span>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
