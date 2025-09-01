'use server';

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { pacientes, sesiones_diarias } from "./schema";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

export async function getPacientes(startDate?: string, endDate?: string) {
  try {
    
    if (startDate && endDate) {
      // Obtener IDs de pacientes que tienen sesiones en el rango de fechas
      const sesionesEnRango = await db
        .select({ paciente_id: sesiones_diarias.paciente_id })
        .from(sesiones_diarias)
        .where(
          and(
            gte(sesiones_diarias.fecha, startDate),
            lte(sesiones_diarias.fecha, endDate)
          )
        )
        .all();
      
      const pacienteIds = [...new Set(sesionesEnRango.map(s => s.paciente_id))].filter((id): id is string => id !== null);
      
      
      if (pacienteIds.length === 0) {
        return [];
      }

      const pacientesData = await db
        .select()
        .from(pacientes)
        .where(inArray(pacientes.id, pacienteIds))
        .all();

      // Obtener conteo de sesiones para cada paciente
      const pacientesConSesiones = await Promise.all(
        pacientesData.map(async (paciente) => {
          const sesionesCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(sesiones_diarias)
            .where(eq(sesiones_diarias.paciente_id, paciente.id))
            .get();
          
          return {
            ...paciente,
            sesiones_completadas: sesionesCount?.count || 0
          };
        })
      );

      return pacientesConSesiones;
    }
    
    // Si no hay fechas, devolver todos los pacientes con conteo de sesiones
    const pacientesData = await db.select().from(pacientes).all();
    
    const pacientesConSesiones = await Promise.all(
      pacientesData.map(async (paciente) => {
        const sesionesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(sesiones_diarias)
          .where(eq(sesiones_diarias.paciente_id, paciente.id))
          .get();
        
        return {
          ...paciente,
          sesiones_completadas: sesionesCount?.count || 0
        };
      })
    );

    return pacientesConSesiones;
  } catch (error) {
    console.error("Error fetching patients:", error);
    return [];
  }
}

export async function getPacientesConBusqueda(
  startDate?: string, 
  endDate?: string, 
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 9
) {
  try {
    // Calcular fecha de hace 12 meses
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString();

    let pacientesData;
    
    if (startDate && endDate) {
      // Filtrar pacientes por fecha de creación en el rango especificado
      pacientesData = await db
        .select()
        .from(pacientes)
        .where(
          and(
            gte(pacientes.created_at, startDate),
            lte(pacientes.created_at, endDate),
            gte(pacientes.created_at, twelveMonthsAgoStr)
          )
        )
        .all();
    } else {
      // Si no hay fechas, obtener pacientes creados en los últimos 12 meses
      pacientesData = await db
        .select()
        .from(pacientes)
        .where(gte(pacientes.created_at, twelveMonthsAgoStr))
        .all();
    }

    // Filtrar por búsqueda si se proporciona
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      pacientesData = pacientesData.filter(paciente => 
        paciente.nombre_paciente.toLowerCase().includes(query) ||
        paciente.nombre_kinesiologo.toLowerCase().includes(query)
      );
    }

    // Calcular paginación
    const total = pacientesData.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pacientesPaginados = pacientesData.slice(startIndex, endIndex);

    // Obtener conteo de sesiones para cada paciente
    const pacientesConSesiones = await Promise.all(
      pacientesPaginados.map(async (paciente) => {
        const sesionesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(sesiones_diarias)
          .where(eq(sesiones_diarias.paciente_id, paciente.id))
          .get();
        
        return {
          ...paciente,
          sesiones_completadas: sesionesCount?.count || 0
        };
      })
    );

    return {
      pacientes: pacientesConSesiones,
      total,
      totalPages
    };
  } catch (error) {
    console.error("Error fetching patients:", error);
    return { pacientes: [], total: 0, totalPages: 0 };
  }
}

export async function createPaciente(data: FormData) {
  try {
    const newPaciente = {
      id: crypto.randomUUID(),
      nombre_paciente: data.get("nombre_paciente") as string,
      nombre_kinesiologo: data.get("nombre_kinesiologo") as string,
      sesiones_totales: Number(data.get("sesiones_totales")),
      created_at: new Date().toISOString(),
    };

    await db.insert(pacientes).values(newPaciente);
    revalidatePath("/");
    return { success: true, message: "Paciente creado con éxito." };
  } catch (error) {
    console.error("Error creating patient:", error);
    return { success: false, message: "Error al crear el paciente." };
  }
}

export const updatePatient = async (id: string, data: FormData) => {
  try {
    const updatedPaciente = {
      nombre_paciente: data.get("nombre_paciente") as string,
      nombre_kinesiologo: data.get("nombre_kinesiologo") as string,
      sesiones_totales: Number(data.get("sesiones_totales")),
    };

    await db.update(pacientes).set(updatedPaciente).where(eq(pacientes.id, id));
    revalidatePath("/");
    revalidatePath(`/paciente/${id}`);
    return { success: true, message: "Paciente actualizado con éxito." };
  } catch (error) {
    console.error("Error updating patient:", error);
    return { success: false, message: "Error al actualizar el paciente." };
  }
}

export const deletePatient = async (id: string) => {
  try {
    // Primero eliminar todas las sesiones relacionadas al paciente
    await db.delete(sesiones_diarias).where(eq(sesiones_diarias.paciente_id, id));
    
    // Luego eliminar el paciente
    await db.delete(pacientes).where(eq(pacientes.id, id));
    
    revalidatePath("/");
    return {
      success: true,
      message: "Paciente eliminado con éxito",
    };
  } catch (error) {
    console.error("Error eliminando paciente:", error);
    return {
      success: false,
      message: "Error al eliminar el paciente",
    };
  }
};

export async function getPaciente(id: string) {
  try {
    return db.select().from(pacientes).where(eq(pacientes.id, id)).get();
  } catch (error) {
    console.error(`Error fetching patient with id ${id}:`, error);
    return undefined;
  }
}

export async function getSesionesDiarias(paciente_id: string) {
  try {
    return db
      .select()
      .from(sesiones_diarias)
      .where(eq(sesiones_diarias.paciente_id, paciente_id))
      .all();
  } catch (error) {
    console.error(
      `Error fetching sessions for patient with id ${paciente_id}:`,
      error
    );
    return [];
  }
}

export async function createSesionDiaria(data: FormData) {
  try {
    const paciente_id = data.get("paciente_id") as string;

    const now = new Date();
    const fecha = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    
    const newSesionDiaria = {
      id: crypto.randomUUID(),
      paciente_id,
      fecha: fecha,
      hora: new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      sentimiento: data.get("sentimiento") as "verde" | "amarillo" | "rojo",
    };

    await db.insert(sesiones_diarias).values(newSesionDiaria);

    revalidatePath(`/paciente/${paciente_id}`);
    return { success: true, message: "Sesión creada con éxito." };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, message: "Error al crear la sesión." };
  }
}

export async function updateSesionDiaria(id: string, data: FormData) {
  try {
    const paciente_id = data.get("paciente_id") as string;
    const fecha = data.get("fecha") as string;
    const hora = data.get("hora") as string;
    const sentimiento = data.get("sentimiento") as "verde" | "amarillo" | "rojo";

    await db.update(sesiones_diarias)
      .set({
        fecha,
        hora,
        sentimiento
      })
      .where(eq(sesiones_diarias.id, id));

    revalidatePath(`/paciente/${paciente_id}`);
    return { success: true, message: "Sesión actualizada con éxito." };
  } catch (error) {
    console.error("Error updating session:", error);
    return { success: false, message: "Error al actualizar la sesión." };
  }
}

export async function deleteSesionDiaria(id: string, paciente_id: string) {
  try {
    await db.delete(sesiones_diarias).where(eq(sesiones_diarias.id, id));
    
    revalidatePath(`/paciente/${paciente_id}`);
    return { success: true, message: "Sesión eliminada con éxito." };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { success: false, message: "Error al eliminar la sesión." };
  }
}

export async function getSesionesPorRangoFechas(startDate: string, endDate: string) {
  try {
    console.log('Buscando sesiones entre:', startDate, 'y', endDate);
    
    // Obtener todas las sesiones con información del paciente
    const sesiones = await db
      .select({
        id: sesiones_diarias.id,
        fecha: sesiones_diarias.fecha,
        hora: sesiones_diarias.hora,
        sentimiento: sesiones_diarias.sentimiento,
        paciente_id: sesiones_diarias.paciente_id,
        nombre_paciente: pacientes.nombre_paciente,
        nombre_kinesiologo: pacientes.nombre_kinesiologo,
      })
      .from(sesiones_diarias)
      .innerJoin(pacientes, eq(sesiones_diarias.paciente_id, pacientes.id))
      .orderBy(sesiones_diarias.fecha, sesiones_diarias.hora)
      .all();

    console.log('Todas las sesiones encontradas:', sesiones.map(s => ({ fecha: s.fecha, paciente: s.nombre_paciente })));

    // Filtrar sesiones por rango de fechas
    const sesionesEnRango = sesiones.filter(sesion => {
      // Convertir fechas de DD-MM-YYYY a objetos Date para comparación
      const [dia, mes, año] = sesion.fecha.split('-').map(Number);
      const fechaSesion = new Date(año, mes - 1, dia); // mes - 1 porque los meses van de 0-11
      
      const [startDia, startMes, startAño] = startDate.split('-').map(Number);
      const fechaInicio = new Date(startAño, startMes - 1, startDia);
      
      const [endDia, endMes, endAño] = endDate.split('-').map(Number);
      const fechaFin = new Date(endAño, endMes - 1, endDia);
      
      const enRango = fechaSesion >= fechaInicio && fechaSesion <= fechaFin;
      console.log(`Sesión ${sesion.fecha} (${fechaSesion.toISOString()}) en rango ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}: ${enRango}`);
      
      return enRango;
    });

    console.log('Sesiones en rango:', sesionesEnRango.map(s => ({ fecha: s.fecha, paciente: s.nombre_paciente })));

    // Organizar sesiones por día
    const sesionesPorDia: Record<string, typeof sesiones> = {};
    
    sesionesEnRango.forEach(sesion => {
      if (!sesionesPorDia[sesion.fecha]) {
        sesionesPorDia[sesion.fecha] = [];
      }
      sesionesPorDia[sesion.fecha].push(sesion);
    });

    return {
      success: true,
      data: sesionesPorDia,
      totalSesiones: sesionesEnRango.length,
      diasConSesiones: Object.keys(sesionesPorDia).length
    };
  } catch (error) {
    console.error("Error fetching sessions by date range:", error);
    return { 
      success: false, 
      data: {}, 
      totalSesiones: 0, 
      diasConSesiones: 0,
      error: "Error al obtener las sesiones" 
    };
  }
}

