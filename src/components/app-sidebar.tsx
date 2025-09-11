'use client';

import { Users, BarChart3, Settings, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserNav } from './user-nav';
import { ModeToggle } from './theme-toggle';

// Elementos del menú
const items = [
    {
        title: 'Administración',
        url: '/administracion',
        icon: Settings,
    },
    {
        title: 'Pacientes',
        url: '/pacientes',
        icon: Users,
    },
    {
        title: 'Estadísticas',
        url: '/estadisticas',
        icon: BarChart3,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

    // Función para determinar si un elemento del menú está activo
    const isItemActive = (item: typeof items[0]) => {
        if (item.title === 'Administración') {
            // Para Administración, considerar activo si estamos en la raíz o en cualquier ruta de administración
            return pathname === '/' || pathname === '/administracion' || pathname.startsWith('/administracion/');
        }
        return pathname === item.url;
    };

    return (
        <Sidebar 
            collapsible="offcanvas" 
        >
            <SidebarHeader>
                <div className="flex items-center justify-between">
                    <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-inherit flex-1"
                    >
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-full">
                            <img
                                src="/recovery-point-logo.jpg"
                                alt="Recovery Point Logo"
                                className="size-8 object-contain rounded-full"
                            />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">Recovery Point</span>
                            <span className="truncate text-xs">Sistema de Gestión</span>
                        </div>
                    </SidebarMenuButton>
                    <SidebarTrigger className="ml-2" />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isItemActive(item)}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <div className="flex flex-col items-start space-y-5 justify-between px-2 py-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-1">
                    <div className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                        <ModeToggle />
                    </div>
                    <div className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                        <UserNav />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}