'use client';

import { useSidebar } from '@/components/ui/sidebar';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { state, setOpen } = useSidebar();

  const handleClick = () => {
    // Solo cerrar si el sidebar está abierto
    if (state === 'expanded') {
      setOpen(false);
    }
  };

  return (
    <main 
      className="flex-1 flex flex-col w-full relative transition-all duration-200 ease-linear group-data-[state=expanded]:ml-[calc(var(--sidebar-width)+1rem)] group-data-[state=collapsed]:ml-0"
      onClick={handleClick}
    >
      <div className="flex-1 px-4 py-4">
        {children}
      </div>
    </main>
  );
}
