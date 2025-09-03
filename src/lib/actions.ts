'use server';

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { pacientes, sesiones_diarias, evaluaciones } from "./schema";
import { eq, and, gte, lte, inArray, sql, desc } from "drizzle-orm";

interface EvaluationResponse {
  questionId: string;
  value: number;
}

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
        paciente.tipo_paciente.toLowerCase().includes(query) ||
        (paciente.obra_social && paciente.obra_social.toLowerCase().includes(query))
      );
    }

    // Calcular paginación
    const total = pacientesData.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pacientesPaginados = pacientesData.slice(startIndex, endIndex);

    // Obtener conteo de sesiones y estado de evaluación para cada paciente
    const pacientesConSesiones = await Promise.all(
      pacientesPaginados.map(async (paciente) => {
        const sesionesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(sesiones_diarias)
          .where(eq(sesiones_diarias.paciente_id, paciente.id))
          .get();
        
        // Obtener la última sesión del paciente
        const ultimaSesion = await db
          .select()
          .from(sesiones_diarias)
          .where(eq(sesiones_diarias.paciente_id, paciente.id))
          .orderBy(desc(sesiones_diarias.fecha), desc(sesiones_diarias.hora))
          .get();
        
        // Verificar estado de evaluación
        let evaluacionPendiente = false;
        if (ultimaSesion) {
          const evaluacionesData = await db
            .select()
            .from(evaluaciones)
            .where(eq(evaluaciones.sesionId, ultimaSesion.id))
            .all();
          
          // Verificar si falta la evaluación post-sesión
          evaluacionesData.forEach((evaluacion: { respuestasComprimidas: string }) => {
            try {
              const respuestas = JSON.parse(evaluacion.respuestasComprimidas);
              const tieneEvaluacionPre = respuestas.some((r: EvaluationResponse) => r.questionId.includes('_pre'));
              const tieneEvaluacionPost = respuestas.some((r: EvaluationResponse) => r.questionId.includes('_post'));
              
              // Si tiene pre-evaluación pero no post-evaluación, está pendiente
              if (tieneEvaluacionPre && !tieneEvaluacionPost) {
                evaluacionPendiente = true;
              }
            } catch (error) {
              console.error('Error parsing evaluation:', error);
            }
          });
        }
        
        return {
          ...paciente,
          sesiones_completadas: sesionesCount?.count || 0,
          evaluacionPendiente
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
    const tipoPaciente = data.get("tipo_paciente") as string;
    const obraSocial = tipoPaciente === "obra_social" ? data.get("obra_social") as string : null;
    
    const newPaciente = {
      id: crypto.randomUUID(),
      nombre_paciente: data.get("nombre_paciente") as string,
      tipo_paciente: tipoPaciente as "particular" | "obra_social",
      obra_social: obraSocial,
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
    const tipoPaciente = data.get("tipo_paciente") as string;
    const obraSocial = tipoPaciente === "obra_social" ? data.get("obra_social") as string : null;
    
    const updatedPaciente = {
      nombre_paciente: data.get("nombre_paciente") as string,
      tipo_paciente: tipoPaciente as "particular" | "obra_social",
      obra_social: obraSocial,
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
    const sesiones = await db
      .select()
      .from(sesiones_diarias)
      .where(eq(sesiones_diarias.paciente_id, paciente_id))
      .all();

    // Obtener evaluaciones para cada sesión
    const sesionesConEvaluaciones = await Promise.all(
      sesiones.map(async (sesion) => {
        const evaluacion = await db
          .select({
            id: evaluaciones.id,
            promediosComprimidos: evaluaciones.promediosComprimidos,
          })
          .from(evaluaciones)
          .where(eq(evaluaciones.sesionId, sesion.id))
          .get();

        let promedioGeneral = null;
        if (evaluacion?.promediosComprimidos) {
          try {
            const promedios = JSON.parse(evaluacion.promediosComprimidos);
            // Calcular promedio general de todos los promedios
            const valores = Object.values(promedios).filter(val => typeof val === 'number');
            if (valores.length > 0) {
              promedioGeneral = valores.reduce((sum: number, val: number) => sum + val, 0) / valores.length;
            }
          } catch (error) {
            console.error('Error parseando promedios:', error);
          }
        }

        return {
          ...sesion,
          evaluacionId: evaluacion?.id || null,
          promedioGeneral: promedioGeneral ? Math.round(promedioGeneral * 100) / 100 : null,
        };
      })
    );

    return sesionesConEvaluaciones;
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

    // Crear fecha y hora usando la zona horaria local
    // Este enfoque es más robusto para iOS Safari
    const now = new Date();
    
    // Formatear fecha usando métodos que respetan la zona horaria local
    const dia = now.getDate().toString().padStart(2, '0');
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    const año = now.getFullYear();
    const fecha = `${dia}-${mes}-${año}`;
    
    // Formatear hora usando métodos que respetan la zona horaria local
    const horas = now.getHours().toString().padStart(2, '0');
    const minutos = now.getMinutes().toString().padStart(2, '0');
    const hora = `${horas}:${minutos}`;
    
    const newSesionDiaria = {
      id: crypto.randomUUID(),
      paciente_id,
      fecha: fecha,
      hora: hora,
      sentimiento: data.get("sentimiento") as "verde" | "amarillo" | "rojo",
    };

    await db.insert(sesiones_diarias).values(newSesionDiaria);

    // Revalidar la página del paciente para actualizar el estado
    revalidatePath(`/paciente/${paciente_id}`);
    
    // También revalidar la página principal por si acaso
    revalidatePath("/");
    
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
    
    // Obtener todas las sesiones con información del paciente
    const sesiones = await db
      .select({
        id: sesiones_diarias.id,
        fecha: sesiones_diarias.fecha,
        hora: sesiones_diarias.hora,
        sentimiento: sesiones_diarias.sentimiento,
        paciente_id: sesiones_diarias.paciente_id,
        nombre_paciente: pacientes.nombre_paciente,
        tipo_paciente: pacientes.tipo_paciente,
        obra_social: pacientes.obra_social,
      })
      .from(sesiones_diarias)
      .innerJoin(pacientes, eq(sesiones_diarias.paciente_id, pacientes.id))
      .orderBy(sesiones_diarias.fecha, sesiones_diarias.hora)
      .all();

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
      
      return enRango;
    });


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

// Funciones para manejar evaluaciones
export async function getUltimaSesion(pacienteId: string) {
  try {
    
    const ultimaSesion = await db
      .select()
      .from(sesiones_diarias)
      .where(eq(sesiones_diarias.paciente_id, pacienteId))
      .orderBy(desc(sesiones_diarias.fecha), desc(sesiones_diarias.hora))
      .get();
    
    return ultimaSesion;
  } catch (error) {
    console.error("Error obteniendo última sesión:", error);
    return undefined;
  }
}

export async function getEvaluacionesPorSesion(sesionId: string) {
  try {
    
    const evaluacionesData = await db
      .select()
      .from(evaluaciones)
      .where(eq(evaluaciones.sesionId, sesionId))
      .all();
    
    return evaluacionesData;
  } catch (error) {
    console.error("Error obteniendo evaluaciones:", error);
    return [];
  }
}

export async function createEvaluacion(data: {
  pacienteId: string;
  sesionId: string;
  fecha: string;
  respuestasComprimidas: string;
  promediosComprimidos: string;
}) {
  try {
    // Verificar si ya existe una evaluación para esta sesión
    const evaluacionExistente = await db
      .select()
      .from(evaluaciones)
      .where(eq(evaluaciones.sesionId, data.sesionId))
      .get();

    if (evaluacionExistente) {
      // Actualizar evaluación existente
      
      // Parsear respuestas existentes
      let respuestasExistentes: EvaluationResponse[] = [];
      try {
        respuestasExistentes = JSON.parse(evaluacionExistente.respuestasComprimidas);
      } catch {
        console.warn('Error parseando respuestas existentes, iniciando array vacío');
        respuestasExistentes = [];
      }

      // Parsear nuevas respuestas
      const nuevasRespuestas = JSON.parse(data.respuestasComprimidas);
      
      // Combinar respuestas (evitar duplicados)
      const respuestasCombinadas = [...respuestasExistentes];
      nuevasRespuestas.forEach((nuevaRespuesta: EvaluationResponse) => {
        const index = respuestasCombinadas.findIndex(r => r.questionId === nuevaRespuesta.questionId);
        if (index >= 0) {
          respuestasCombinadas[index] = nuevaRespuesta;
        } else {
          respuestasCombinadas.push(nuevaRespuesta);
        }
      });

      // Calcular promedios combinados
      const promediosExistentes = JSON.parse(evaluacionExistente.promediosComprimidos || '{}');
      const nuevosPromedios = JSON.parse(data.promediosComprimidos);
      const promediosCombinados = { ...promediosExistentes, ...nuevosPromedios };

      // Actualizar la evaluación
      await db
        .update(evaluaciones)
        .set({
          respuestasComprimidas: JSON.stringify(respuestasCombinadas),
          promediosComprimidos: JSON.stringify(promediosCombinados),
          fecha: data.fecha
        })
        .where(eq(evaluaciones.id, evaluacionExistente.id));

      revalidatePath(`/paciente/${data.pacienteId}`);
      return { success: true, message: "Evaluación actualizada con éxito." };
    } else {
      // Crear nueva evaluación
      const newEvaluacion = {
        id: crypto.randomUUID(),
        pacienteId: data.pacienteId,
        sesionId: data.sesionId,
        fecha: data.fecha,
        respuestasComprimidas: data.respuestasComprimidas,
        promediosComprimidos: data.promediosComprimidos,
        createdAt: new Date().toISOString(),
      };

      await db.insert(evaluaciones).values(newEvaluacion);
      revalidatePath(`/paciente/${data.pacienteId}`);
      return { success: true, message: "Evaluación guardada con éxito." };
    }
  } catch (error) {
    console.error("Error creando/actualizando evaluación:", error);
    return { success: false, message: "Error al guardar la evaluación." };
  }
}

export async function getEvaluacionesPorPaciente(pacienteId: string) {
  try {
    const evaluacionesData = await db
      .select({
        id: evaluaciones.id,
        fecha: evaluaciones.fecha,
        respuestasComprimidas: evaluaciones.respuestasComprimidas,
        promediosComprimidos: evaluaciones.promediosComprimidos,
        createdAt: evaluaciones.createdAt,
        sesionId: evaluaciones.sesionId,
        sesionFecha: sesiones_diarias.fecha,
        sesionHora: sesiones_diarias.hora,
      })
      .from(evaluaciones)
      .innerJoin(sesiones_diarias, eq(evaluaciones.sesionId, sesiones_diarias.id))
      .where(eq(evaluaciones.pacienteId, pacienteId))
      .orderBy(desc(evaluaciones.createdAt))
      .all();
    
    return evaluacionesData;
  } catch (error) {
    console.error("Error obteniendo evaluaciones del paciente:", error);
    return [];
  }
}

// Función para limpiar evaluaciones corruptas o vacías
export async function limpiarEvaluacionesCorruptas() {
  try {
    
    // Obtener todas las evaluaciones
    const todasEvaluaciones = await db
      .select()
      .from(evaluaciones)
      .all();
    
    
    const evaluacionesCorruptas: string[] = [];
    
    // Identificar evaluaciones corruptas o vacías
    todasEvaluaciones.forEach(evaluacion => {
      try {
        // Verificar si los datos son JSON válido
        if (!evaluacion.respuestasComprimidas || 
            typeof evaluacion.respuestasComprimidas !== 'string' ||
            !evaluacion.respuestasComprimidas.startsWith('[') && !evaluacion.respuestasComprimidas.startsWith('{')) {
          evaluacionesCorruptas.push(evaluacion.id);
        } else {
          // Intentar parsear para verificar que sea JSON válido y no esté vacío
          const respuestas = JSON.parse(evaluacion.respuestasComprimidas);
          if (!Array.isArray(respuestas) || respuestas.length === 0) {
            evaluacionesCorruptas.push(evaluacion.id);
          }
        }
      } catch (error) {
        evaluacionesCorruptas.push(evaluacion.id);
      }
    });
    
    
    // Eliminar evaluaciones corruptas
    if (evaluacionesCorruptas.length > 0) {
      await db
        .delete(evaluaciones)
        .where(inArray(evaluaciones.id, evaluacionesCorruptas));
      
    }
    
    return {
      success: true,
      totalEvaluaciones: todasEvaluaciones.length,
      evaluacionesCorruptas: evaluacionesCorruptas.length,
      eliminadas: evaluacionesCorruptas
    };
  } catch (error) {
    console.error('Error limpiando evaluaciones corruptas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

