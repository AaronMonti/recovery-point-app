'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
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
  
  // Estado para las fechas individuales - inicializar solo una vez
  const [startDate, setStartDate] = useState<Date | undefined>(() =>
    startDateParam ? new Date(startDateParam) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(() =>
    endDateParam ? new Date(endDateParam) : undefined
  );

  // Sincronizar estado local con parámetros URL cuando cambien externamente
  useEffect(() => {
    const newStartDate = startDateParam ? new Date(startDateParam) : undefined;
    const newEndDate = endDateParam ? new Date(endDateParam) : undefined;
    
    setStartDate(prev => {
      if (!prev && !newStartDate) return prev;
      if (prev && newStartDate && prev.getTime() === newStartDate.getTime()) return prev;
      return newStartDate;
    });
    
    setEndDate(prev => {
      if (!prev && !newEndDate) return prev;
      if (prev && newEndDate && prev.getTime() === newEndDate.getTime()) return prev;
      return newEndDate;
    });
  }, [startDateParam, endDateParam]);

  // Función para aplicar el filtro - memoizada para evitar re-creaciones
  const applyFilter = useCallback(() => {
    startTransition(() => {
      if (startDate && endDate) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('startDate', format(startDate, 'yyyy-MM-dd'));
        params.set('endDate', format(endDate, 'yyyy-MM-dd'));
        // Resetear página a 1 cuando se aplica un filtro
        params.delete('page');
        router.push(`/pacientes?${params.toString()}`, { scroll: false });
      }
    });
  }, [startDate, endDate, searchParams, router, startTransition]);

  // Función para limpiar el filtro - memoizada para evitar re-creaciones
  const clearFilter = useCallback(() => {
    startTransition(() => {
      setStartDate(undefined);
      setEndDate(undefined);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('startDate');
      params.delete('endDate');
      params.delete('page');
      router.push(`/pacientes?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router, startTransition]);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <DatePicker
          date={startDate}
          onDateChange={setStartDate}
          placeholder="Fecha inicio"
          maxDate={endDate}
          className="h-10"
        />
        <DatePicker
          date={endDate}
          onDateChange={setEndDate}
          placeholder="Fecha fin"
          minDate={startDate}
          className="h-10"
        />
      </div>
      <div className="flex gap-2 h-10">
        <Button 
          onClick={applyFilter} 
          disabled={!startDate || !endDate || isPending}
          className="min-w-[120px] h-10"
        >
          {isPending ? 'Aplicando...' : 'Aplicar Filtro'}
        </Button>
        <Button 
          variant="outline" 
          onClick={clearFilter}
          disabled={isPending || (!startDateParam && !endDateParam)}
          className="min-w-[80px] h-10"
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
}