'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Obtener fechas de los parámetros de búsqueda
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  
  // Estado para las fechas individuales
  const [startDate, setStartDate] = useState<Date | undefined>(
    startDateParam ? new Date(startDateParam) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    endDateParam ? new Date(endDateParam) : undefined
  );

  // Función para aplicar el filtro
  const applyFilter = () => {
    startTransition(() => {
      if (startDate && endDate) {
        const params = new URLSearchParams(searchParams);
        params.set('startDate', format(startDate, 'yyyy-MM-dd'));
        params.set('endDate', format(endDate, 'yyyy-MM-dd'));
        router.push(`/?${params.toString()}`);
      }
    });
  };

  // Función para limpiar el filtro
  const clearFilter = () => {
    startTransition(() => {
      setStartDate(undefined);
      setEndDate(undefined);
      const params = new URLSearchParams(searchParams);
      params.delete('startDate');
      params.delete('endDate');
      router.push(`/?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <DatePicker
          date={startDate}
          onDateChange={setStartDate}
          label="Fecha de inicio"
          placeholder="Seleccionar fecha inicio"
          maxDate={endDate}
        />
        <DatePicker
          date={endDate}
          onDateChange={setEndDate}
          label="Fecha de fin"
          placeholder="Seleccionar fecha fin"
          minDate={startDate}
        />
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={applyFilter} 
          disabled={!startDate || !endDate || isPending}
          className="min-w-[120px]"
        >
          {isPending ? 'Aplicando...' : 'Aplicar Filtro'}
        </Button>
        <Button 
          variant="outline" 
          onClick={clearFilter}
          disabled={isPending || (!startDateParam && !endDateParam)}
          className="min-w-[80px]"
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
}