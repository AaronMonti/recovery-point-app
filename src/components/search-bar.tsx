'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';


export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Memorizar la función para actualizar la URL para evitar re-creaciones innecesarias
  const updateSearchParams = useMemo(() => {
    return (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      // Resetear página a 1 cuando se hace una nueva búsqueda
      params.delete('page');
      router.push(`/pacientes?${params.toString()}`, { scroll: false });
    };
  }, [searchParams, router]);

  // Debounce para la búsqueda - optimizado para evitar llamadas innecesarias
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    
    // Solo actualizar si el valor realmente cambió
    if (searchQuery === currentSearch) {
      return;
    }

    const timer = setTimeout(() => {
      updateSearchParams(searchQuery);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, updateSearchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative max-w-full md:max-w-sm h-10">
      <Input
        type="search"
        placeholder="Buscar pacientes..."
        value={searchQuery}
        onChange={handleSearch}
        className="h-10"
      />
    </div>
  );
}
