'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ProtectedPage } from "@/components/protected-page";
import { getEstadisticasPacientesPorHora, getEstadisticasPacientesPorDia } from "@/lib/actions";
import { BarChart3, Clock, Calendar, TrendingUp, Activity } from "lucide-react";
import { ChartContainer, ChartConfig, ChartTooltipContent, ChartTooltip, ChartLegendContent, ChartLegend } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type FiltroTiempo = 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

interface DatosPorHora {
  hora: string;
  cantidad: number;
  horaDisplay: string;
}

interface DatosPorDia {
  periodo: string;
  cantidad: number;
}

const chartConfig = {
  hora: {
    label: "Hora",
    color: "#2563eb",
  },
  cantidad: {
    label: "Cantidad",
    color: "#60a5fa",
  },
} satisfies ChartConfig


export default function EstadisticasPage() {
  const [datosPorHora, setDatosPorHora] = useState<DatosPorHora[]>([]);
  const [datosPorDia, setDatosPorDia] = useState<DatosPorDia[]>([]);
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('mensual');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(undefined);
  const [cargandoHoras, setCargandoHoras] = useState(true);
  const [cargandoDias, setCargandoDias] = useState(true);
  const [totalSesionesHora, setTotalSesionesHora] = useState(0);
  const [totalSesionesDia, setTotalSesionesDia] = useState(0);


  // Cargar datos por hora cuando cambia la fecha seleccionada
  useEffect(() => {
    async function cargarDatosPorHora() {
      setCargandoHoras(true);
      try {
        let fechaParam: string | undefined = undefined;
        
        if (fechaSeleccionada) {
          const dia = fechaSeleccionada.getDate().toString().padStart(2, '0');
          const mes = (fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0');
          const año = fechaSeleccionada.getFullYear();
          fechaParam = `${dia}-${mes}-${año}`;
        }
        
        const resultado = await getEstadisticasPacientesPorHora(fechaParam);
        if (resultado.success) {
          setDatosPorHora(resultado.datos);
          setTotalSesionesHora(resultado.totalSesiones);
        }
      } catch (error) {
        console.error('Error cargando datos por hora:', error);
      } finally {
        setCargandoHoras(false);
      }
    }

    cargarDatosPorHora();
  }, [fechaSeleccionada]);

  // Cargar datos por día cuando cambia el filtro
  useEffect(() => {
    async function cargarDatosPorDia() {
      setCargandoDias(true);
      try {
        const resultado = await getEstadisticasPacientesPorDia(filtroTiempo);
        if (resultado.success) {
          setDatosPorDia(resultado.datos);
          setTotalSesionesDia(resultado.totalSesiones);
        }
      } catch (error) {
        console.error('Error cargando datos por día:', error);
      } finally {
        setCargandoDias(false);
      }
    }

    cargarDatosPorDia();
  }, [filtroTiempo]);

  const obtenerNombreFiltro = (filtro: FiltroTiempo): string => {
    const nombres = {
      semanal: 'Última Semana',
      mensual: 'Último Mes',
      trimestral: 'Último Trimestre',
      semestral: 'Último Semestre',
      anual: 'Último Año'
    };
    return nombres[filtro];
  };

  const chartConfig = {
    cantidad: {
      label: "Cantidad",
      color: "#60a5fa",
    },
  } satisfies ChartConfig

  const chartData = datosPorHora

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <main>
          <div className="container mx-auto py-8 px-4 md:px-6">
            {/* Título principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Estadísticas de Sesiones
                </h1>
                <p className="text-muted-foreground text-lg">
                  Análisis visual de la distribución de sesiones por horario y período
                </p>
              </div>
            </div>

            {/* Resumen general */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-muted-foreground/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSesionesHora}</div>
                  <p className="text-xs text-muted-foreground">
                    Sesiones registradas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-muted-foreground/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Horario Pico</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {datosPorHora.length > 0 ?
                      datosPorHora.reduce((max, curr) => curr.cantidad > max.cantidad ? curr : max).horaDisplay
                      : '--'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hora con más actividad
                  </p>
                </CardContent>
              </Card>

              <Card className="border-muted-foreground/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Período Actual</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSesionesDia}</div>
                  <p className="text-xs text-muted-foreground">
                    Sesiones en {obtenerNombreFiltro(filtroTiempo).toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico por horas */}
            <Card className="mb-8 border-muted-foreground/20">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Distribución por Horario (8 AM - 8 PM)</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {fechaSeleccionada 
                          ? `Sesiones del ${fechaSeleccionada.toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}`
                          : 'Todas las sesiones por hora del día'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DatePicker
                      date={fechaSeleccionada}
                      onDateChange={setFechaSeleccionada}
                      placeholder="Seleccionar fecha"
                    />
                    {fechaSeleccionada && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFechaSeleccionada(undefined)}
                      >
                        Ver todas
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {cargandoHoras ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BarChart3 className="h-4 w-4 animate-spin" />
                      Cargando datos...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ChartContainer config={chartConfig} className="min-h-[200px] h-[400px] w-full">
                      <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <YAxis />
                        <XAxis
                          dataKey="hora"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico por días/períodos */}
            <Card className="border-muted-foreground/20">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Distribución por Período</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Cantidad de sesiones en {obtenerNombreFiltro(filtroTiempo).toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <Select value={filtroTiempo} onValueChange={(value: FiltroTiempo) => setFiltroTiempo(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Última Semana</SelectItem>
                      <SelectItem value="mensual">Último Mes</SelectItem>
                      <SelectItem value="trimestral">Último Trimestre</SelectItem>
                      <SelectItem value="semestral">Último Semestre</SelectItem>
                      <SelectItem value="anual">Último Año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {cargandoDias ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BarChart3 className="h-4 w-4 animate-spin" />
                      Cargando datos...
                    </div>
                  </div>
                ) : datosPorDia.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center space-y-2">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-semibold">No hay datos disponibles</h3>
                      <p className="text-muted-foreground">
                        No se encontraron sesiones en {obtenerNombreFiltro(filtroTiempo).toLowerCase()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ChartContainer config={chartConfig} className="min-h-[200px] h-[400px] w-full">
                      <BarChart accessibilityLayer data={datosPorDia}>
                        <CartesianGrid vertical={false} />
                        <YAxis />
                        <XAxis
                          dataKey="periodo"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
