'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';


export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Función para actualizar la URL con el parámetro de búsqueda
  const updateSearchParams = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearchParams(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, updateSearchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative max-w-full md:max-w-sm">
      <Input
        type="search"
        placeholder="Buscar pacientes..."
        value={searchQuery}
        onChange={handleSearch}
      />
    </div>
  );
}
