'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

export function FloatingSidebarTrigger() {
  const { state } = useSidebar();
  
  // Solo mostrar cuando el sidebar está colapsado
  if (state !== 'collapsed') {
    return null;
  }

  return (
    <div className="fixed top-2 left-3 z-50">
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-md shadow-lg p-1">
        <SidebarTrigger />
      </div>
    </div>
  );
}
