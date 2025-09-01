'use client';

import { updateSesionDiaria } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Heart, Smile, Meh, Frown, Save, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

interface EditSesionFormProps {
  sesion: {
    id: string;
    paciente_id: string | null;
    fecha: string;
    hora: string;
    sentimiento: "verde" | "amarillo" | "rojo";
  };
  onClose: () => void;
}

function FormFields({ 
  selectedSentimiento, 
  setSelectedSentimiento, 
  setFecha, 
  hora, 
  setHora, 
  selectedDate, 
  setSelectedDate 
}: {
  selectedSentimiento: string;
  setSelectedSentimiento: (value: string) => void;
  setFecha: (value: string) => void;
  hora: string;
  setHora: (value: string) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
}) {
  const { pending } = useFormStatus();

  // Manejar cambio de fecha desde el DatePicker
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      setFecha(formattedDate);
    }
  };

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
    <div className="space-y-4">
      {/* Fecha */}
      <div className="space-y-2">
        <DatePicker
          date={selectedDate}
          onDateChange={handleDateChange}
          label="Fecha de la sesión"
          placeholder="Seleccionar fecha"
          required
          disabled={pending}
          className="w-full"
        />
      </div>

      {/* Hora */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Hora de la sesión
        </Label>
        <Input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          disabled={pending}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          required
        />
      </div>

      {/* Sentimiento */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          ¿Cómo te sentías en esa sesión?
        </Label>
        <div className="flex gap-6 justify-center">
          {sentimientos.map((s) => {
            const IconComponent = s.icon;
            const isSelected = selectedSentimiento === s.value;

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
                onClick={() => setSelectedSentimiento(s.value)}
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
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="submit"
      disabled={pending}
      className="flex-1 gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

function CancelButton({ onClose }: { onClose: () => void }) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={onClose}
      className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Cancelar
    </Button>
  );
}

export function EditSesionForm({ sesion, onClose }: EditSesionFormProps) {
  const router = useRouter();
  const [selectedSentimiento, setSelectedSentimiento] = useState<string>(sesion.sentimiento);
  const [fecha, setFecha] = useState(sesion.fecha);
  const [hora, setHora] = useState(sesion.hora);

  // Convertir fecha dd-mm-yyyy a Date object para el DatePicker
  const parseFecha = (fechaStr: string): Date | undefined => {
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (day && month && year && year > 1900 && year < 2100) {
        return new Date(year, month - 1, day);
      }
    }
    return undefined;
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(parseFecha(sesion.fecha));

  async function handleSubmit(formData: FormData) {
    if (!sesion.paciente_id) {
      toast.error("Error: ID de paciente no válido");
      return;
    }
    
    formData.append("paciente_id", sesion.paciente_id);
    formData.append("fecha", fecha);
    formData.append("hora", hora);
    formData.append("sentimiento", selectedSentimiento);
    
    const result = await updateSesionDiaria(sesion.id, formData);

    if (result.success) {
      toast.success(result.message);
      // Cerrar el diálogo inmediatamente
      onClose();
      // Refrescar la página después de un pequeño delay
      setTimeout(() => {
        router.refresh();
      }, 100);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <FormFields 
        selectedSentimiento={selectedSentimiento}
        setSelectedSentimiento={setSelectedSentimiento}
        setFecha={setFecha}
        hora={hora}
        setHora={setHora}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <div className="flex gap-3">
        <CancelButton onClose={onClose} />
        <SubmitButton />
      </div>
    </form>
  );
}
