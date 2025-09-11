'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategorias } from '@/lib/actions';
import { Tag } from 'lucide-react';

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string | null;
}

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  
  const selectedCategory = searchParams.get('categoria') || '';

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const result = await getCategorias();
        if (result.success && result.data) {
          setCategorias(result.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Tag className="h-4 w-4 animate-spin" />
        Cargando categorías...
      </div>
    );
  }

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
