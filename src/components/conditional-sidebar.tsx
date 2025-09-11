'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';

export function ConditionalSidebar() {
  const pathname = usePathname();
  
  // No mostrar sidebar en la página de login
  if (pathname === '/login') {
    return null;
  }
  
  return <AppSidebar />;
}
