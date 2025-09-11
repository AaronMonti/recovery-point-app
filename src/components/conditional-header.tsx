'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // No mostrar header en la página de login
  if (pathname === '/login') {
    return null;
  }
  
  return <Header />;
}
