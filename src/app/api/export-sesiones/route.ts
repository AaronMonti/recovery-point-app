import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSesionesPorRangoFechas } from '@/lib/actions';
import { format, parse, eachDayOfInterval } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Se requieren fechas de inicio y fin' },
        { status: 400 }
      );
    }

    // Obtener las sesiones por rango de fechas
    const result = await getSesionesPorRangoFechas(startDate, endDate);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al obtener las sesiones' },
        { status: 500 }
      );
    }

    const { data: sesionesPorDia, totalSesiones, diasConSesiones } = result;

    // Crear el workbook
    const workbook = XLSX.utils.book_new();

    // Crear la hoja principal con todas las sesiones organizadas por día
    const mainData = [
      ['SESIONES POR DÍA'],
      [''],
      ['Rango de fechas:', `${startDate} - ${endDate}`],
      ['Total de sesiones:', totalSesiones],
      ['Días con sesiones:', diasConSesiones],
      [''],
    ];

    // Generar todas las fechas del rango
    const startDateObj = parse(startDate, 'dd-MM-yyyy', new Date());
    const endDateObj = parse(endDate, 'dd-MM-yyyy', new Date());
    const todasLasFechas = eachDayOfInterval({ start: startDateObj, end: endDateObj });

    // Agregar datos por día
    todasLasFechas.forEach(fecha => {
      const fechaStr = format(fecha, 'dd-MM-yyyy');
      const sesiones = (sesionesPorDia as Record<string, any[]>)[fechaStr] || [];
      
      // Agregar encabezado del día
      mainData.push([`DÍA: ${fechaStr}`]);
      mainData.push(['NOMBRE', 'COLOR', 'HORA']);
      
      if (sesiones.length > 0) {
        sesiones.forEach((sesion: any) => {
          mainData.push([
            sesion.nombre_paciente,
            sesion.sentimiento.toUpperCase(),
            sesion.hora
          ]);
        });
      } else {
        mainData.push(['No hay sesiones registradas para este día', '', '']);
      }
      
      // Agregar espacio entre días
      mainData.push(['']);
      mainData.push(['']);
    });

    const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Sesiones por Día');

    // Crear hoja de resumen
    const resumenData = [
      ['RESUMEN DE SESIONES'],
      [''],
      ['Rango de fechas:', `${startDate} - ${endDate}`],
      ['Total de sesiones:', totalSesiones],
      ['Días con sesiones:', diasConSesiones],
      [''],
      ['FECHA', 'TOTAL SESIONES', 'VERDE', 'AMARILLO', 'ROJO']
    ];

    // Agregar datos del resumen por día
    todasLasFechas.forEach(fecha => {
      const fechaStr = format(fecha, 'dd-MM-yyyy');
      const sesiones = (sesionesPorDia as Record<string, any[]>)[fechaStr] || [];
      const verde = sesiones.filter((s: any) => s.sentimiento === 'verde').length;
      const amarillo = sesiones.filter((s: any) => s.sentimiento === 'amarillo').length;
      const rojo = sesiones.filter((s: any) => s.sentimiento === 'rojo').length;
      
      resumenData.push([
        fechaStr,
        sesiones.length,
        verde,
        amarillo,
        rojo
      ]);
    });

    const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Crear el nombre del archivo
    const fileName = `sesiones_${startDate}_a_${endDate}.xlsx`;

    // Devolver el archivo como respuesta
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error generating Excel file:', error);
    return NextResponse.json(
      { error: 'Error al generar el archivo Excel' },
      { status: 500 }
    );
  }
}
