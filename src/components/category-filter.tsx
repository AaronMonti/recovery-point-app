'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from 'lucide-react';

export interface CategoriaOption {
  id: string;
  nombre: string;
}

interface CategoryFilterProps {
  categorias: CategoriaOption[];
}

export function CategoryFilter({ categorias }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('categoria') || '';

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'todas') {
      params.delete('categoria');
    } else {
      params.set('categoria', value);
    }
    
    // Reset page to 1 when changing category filter
    params.delete('page');
    
    router.push(`/pacientes?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 h-10">
      
      <Select value={selectedCategory || 'todas'} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[200px] h-10">
          <SelectValue placeholder="Filtrar por categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las categorías</SelectItem>
          {categorias.map((categoria) => (
            <SelectItem key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tag className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
