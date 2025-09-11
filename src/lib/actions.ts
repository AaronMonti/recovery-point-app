'use server';

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { pacientes, sesiones_diarias, evaluaciones, categorias, obras_sociales } from "./schema";
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
  categoriaId?: string,
  page: number = 1,
  pageSize: number = 9
) {
  try {
    // Calcular fecha de hace 12 meses
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString();

    let pacientesData;
    
    // Construir condiciones de filtrado
    const conditions = [gte(pacientes.created_at, twelveMonthsAgoStr)];
    
    if (startDate && endDate) {
      conditions.push(
        gte(pacientes.created_at, startDate),
        lte(pacientes.created_at, endDate)
      );
    }
    
    if (categoriaId && categoriaId !== 'todas') {
      conditions.push(eq(pacientes.categoria_id, categoriaId));
    }
    
    // Filtrar pacientes con las condiciones especificadas
    pacientesData = await db
      .select({
        id: pacientes.id,
        nombre_paciente: pacientes.nombre_paciente,
        tipo_paciente: pacientes.tipo_paciente,
        obra_social_id: pacientes.obra_social_id,
        obra_social: obras_sociales.nombre,
        categoria_id: pacientes.categoria_id,
        nota_lesion: pacientes.nota_lesion,
        sesiones_totales: pacientes.sesiones_totales,
        created_at: pacientes.created_at,
      })
      .from(pacientes)
      .leftJoin(obras_sociales, eq(pacientes.obra_social_id, obras_sociales.id))
      .where(and(...conditions))
      .all();

    // Filtrar por búsqueda si se proporciona
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      pacientesData = pacientesData.filter(paciente => 
        paciente.nombre_paciente.toLowerCase().includes(query) ||
        paciente.tipo_paciente.toLowerCase().includes(query) ||
        (paciente.obra_social && paciente.obra_social.toLowerCase().includes(query))
      );
    }

    // Obtener conteo de sesiones y estado de evaluación para TODOS los pacientes (antes de paginar)
    const pacientesConSesiones = await Promise.all(
      pacientesData.map(async (paciente) => {
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
        let fechaUltimaSesion: Date | null = null;
        let diasDesdeSesion = 0;
        
        if (ultimaSesion) {
          // Calcular días desde la última sesión
          const [dia, mes, año] = ultimaSesion.fecha.split('-').map(Number);
          fechaUltimaSesion = new Date(año, mes - 1, dia);
          const hoy = new Date();
          diasDesdeSesion = Math.floor((hoy.getTime() - fechaUltimaSesion.getTime()) / (1000 * 60 * 60 * 24));
          
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
          evaluacionPendiente,
          fechaUltimaSesion,
          diasDesdeSesion
        };
      })
    );

    // Ordenar pacientes: primero los que tienen evaluación pendiente, luego alfabéticamente
    const pacientesOrdenados = pacientesConSesiones.sort((a, b) => {
      // Primero ordenar por evaluación pendiente (pendientes primero)
      if (a.evaluacionPendiente && !b.evaluacionPendiente) return -1;
      if (!a.evaluacionPendiente && b.evaluacionPendiente) return 1;
      
      // Si ambos tienen evaluación pendiente, ordenar por días desde la sesión (más antiguos primero)
      if (a.evaluacionPendiente && b.evaluacionPendiente) {
        return b.diasDesdeSesion - a.diasDesdeSesion;
      }
      
      // Si ninguno tiene evaluación pendiente, ordenar alfabéticamente por nombre
      if (!a.evaluacionPendiente && !b.evaluacionPendiente) {
        return a.nombre_paciente.localeCompare(b.nombre_paciente, 'es', { sensitivity: 'base' });
      }
      
      return 0;
    });

    // AHORA aplicar paginación después del ordenamiento
    const total = pacientesOrdenados.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pacientesPaginados = pacientesOrdenados.slice(startIndex, endIndex);

    return {
      pacientes: pacientesPaginados,
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
    const obraSocialIdRaw = data.get("obra_social_id") as string;
    const obraSocialId = tipoPaciente === "obra_social" && obraSocialIdRaw !== "sin-obra-social" ? obraSocialIdRaw : null;
    const categoriaIdRaw = data.get("categoria_id") as string;
    const categoriaId = categoriaIdRaw === "sin-categoria" ? null : categoriaIdRaw;
    const notaLesion = data.get("nota_lesion") as string || null;
    
    const newPaciente = {
      id: crypto.randomUUID(),
      nombre_paciente: data.get("nombre_paciente") as string,
      tipo_paciente: tipoPaciente as "particular" | "obra_social",
      obra_social_id: obraSocialId,
      categoria_id: categoriaId,
      nota_lesion: notaLesion,
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
    const obraSocialIdRaw = data.get("obra_social_id") as string;
    const obraSocialId = tipoPaciente === "obra_social" && obraSocialIdRaw !== "sin-obra-social" ? obraSocialIdRaw : null;
    const categoriaIdRaw = data.get("categoria_id") as string;
    const categoriaId = categoriaIdRaw === "sin-categoria" ? null : categoriaIdRaw;
    const notaLesion = data.get("nota_lesion") as string || null;
    
    const updatedPaciente = {
      nombre_paciente: data.get("nombre_paciente") as string,
      tipo_paciente: tipoPaciente as "particular" | "obra_social",
      obra_social_id: obraSocialId,
      categoria_id: categoriaId,
      nota_lesion: notaLesion,
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
    // Primero eliminar todas las evaluaciones relacionadas al paciente
    await db.delete(evaluaciones).where(eq(evaluaciones.pacienteId, id));
    
    // Luego eliminar todas las sesiones relacionadas al paciente
    await db.delete(sesiones_diarias).where(eq(sesiones_diarias.paciente_id, id));
    
    // Finalmente eliminar el paciente
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
    const result = await db
      .select({
        id: pacientes.id,
        nombre_paciente: pacientes.nombre_paciente,
        tipo_paciente: pacientes.tipo_paciente,
        obra_social_id: pacientes.obra_social_id,
        obra_social: obras_sociales.nombre,
        categoria_id: pacientes.categoria_id,
        nota_lesion: pacientes.nota_lesion,
        sesiones_totales: pacientes.sesiones_totales,
        created_at: pacientes.created_at,
      })
      .from(pacientes)
      .leftJoin(obras_sociales, eq(pacientes.obra_social_id, obras_sociales.id))
      .where(eq(pacientes.id, id))
      .get();
    
    return result;
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
            
            // Calcular promedios pre y post por separado para ser consistente
            const valoresPre = Object.entries(promedios)
              .filter(([key, val]) => 
                (key === 'stress' || key === 'sueno' || key === 'fatiga' || key === 'dolorMuscular') && 
                typeof val === 'number'
              )
              .map(([, val]) => val as number);
              
            const valoresPost = Object.entries(promedios)
              .filter(([key, val]) => 
                (key === 'percepcionEsfuerzo' || key === 'eva') && 
                typeof val === 'number'
              )
              .map(([, val]) => val as number);
            
            let promedioPre = 0;
            let promedioPost = 0;
            let count = 0;
            
            if (valoresPre.length > 0) {
              promedioPre = valoresPre.reduce((sum, val) => sum + val, 0) / valoresPre.length;
              count++;
            }
            
            if (valoresPost.length > 0) {
              promedioPost = valoresPost.reduce((sum, val) => sum + val, 0) / valoresPost.length;
              count++;
            }
            
            if (count > 0) {
              promedioGeneral = (promedioPre + promedioPost) / count;
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

    // Usar la fecha y hora local enviada desde el cliente
    // Esto garantiza que la hora registrada sea exactamente la del dispositivo del usuario
    const fechaLocal = data.get("fecha_local") as string;
    const horaLocal = data.get("hora_local") as string;
    
    // Fallback: si no se envían fecha/hora locales, usar el servidor
    let fecha = fechaLocal;
    let hora = horaLocal;
    
    if (!fechaLocal || !horaLocal) {
      const now = new Date();
      const dia = now.getDate().toString().padStart(2, '0');
      const mes = (now.getMonth() + 1).toString().padStart(2, '0');
      const año = now.getFullYear();
      fecha = `${dia}-${mes}-${año}`;
      
      const horas = now.getHours().toString().padStart(2, '0');
      const minutos = now.getMinutes().toString().padStart(2, '0');
      hora = `${horas}:${minutos}`;
    }
    
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
        obra_social: obras_sociales.nombre,
      })
      .from(sesiones_diarias)
      .innerJoin(pacientes, eq(sesiones_diarias.paciente_id, pacientes.id))
      .leftJoin(obras_sociales, eq(pacientes.obra_social_id, obras_sociales.id))
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
      } catch {
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

// Funciones para estadísticas y gráficos
export async function getEstadisticasPacientesPorHora(fechaEspecifica?: string) {
  try {
    // Obtener todas las sesiones
    const sesiones = await db
      .select({
        hora: sesiones_diarias.hora,
        fecha: sesiones_diarias.fecha,
      })
      .from(sesiones_diarias)
      .all();
    
    // Filtrar por fecha específica si se proporciona
    const sesionesFiltradas = fechaEspecifica ? 
      sesiones.filter(sesion => sesion.fecha === fechaEspecifica) : 
      sesiones;

    // Agrupar por hora (7am a 8pm)
    const estadisticasPorHora: Record<string, number> = {};
    
    // Inicializar todas las horas de 7 a 20
    for (let i = 7; i <= 20; i++) {
      const hora = `${i.toString().padStart(2, '0')}:00`;
      estadisticasPorHora[hora] = 0;
    }

    // Contar sesiones por hora
    sesionesFiltradas.forEach(sesion => {
      const [hora] = sesion.hora.split(':');
      const horaNum = parseInt(hora);
      
      // Solo contar horas entre 7 y 20
      if (horaNum >= 7 && horaNum <= 20) {
        const horaKey = `${horaNum.toString().padStart(2, '0')}:00`;
        estadisticasPorHora[horaKey]++;
      }
    });

    // Convertir a array para el gráfico
    const datos = Object.entries(estadisticasPorHora).map(([hora, cantidad]) => ({
      hora,
      cantidad,
      horaDisplay: hora === '07:00' ? '7 AM' :
                   hora === '08:00' ? '8 AM' : 
                   hora === '12:00' ? '12 PM' :
                   hora === '20:00' ? '8 PM' :
                   parseInt(hora.split(':')[0]) > 12 ? 
                     `${parseInt(hora.split(':')[0]) - 12} PM` : 
                     `${parseInt(hora.split(':')[0])} AM`
    }));

    return {
      success: true,
      datos,
      totalSesiones: sesionesFiltradas.length,
      fechaSeleccionada: fechaEspecifica
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas por hora:', error);
    return {
      success: false,
      datos: [],
      totalSesiones: 0,
      error: 'Error al obtener estadísticas por hora'
    };
  }
}

export async function getEstadisticasPacientesPorDia(
  filtro: 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual' = 'mensual'
) {
  try {
    // Obtener todas las sesiones
    const sesiones = await db
      .select({
        fecha: sesiones_diarias.fecha,
        created_at: pacientes.created_at,
      })
      .from(sesiones_diarias)
      .innerJoin(pacientes, eq(sesiones_diarias.paciente_id, pacientes.id))
      .all();

    const hoy = new Date();
    let datos: { periodo: string; cantidad: number }[] = [];


    // Función helper para obtener trimestre
    const getQuarter = (month: number): number => {
      return Math.ceil(month / 3);
    };

    // Función helper para obtener semestre
    const getSemester = (month: number): number => {
      return month <= 6 ? 1 : 2;
    };

    switch (filtro) {
      case 'semanal':
        // Últimos 7 días con fechas específicas
        const estadisticasPorFecha: Record<string, number> = {};
        const fechasLabels: string[] = [];
        
        // Generar los últimos 7 días con sus fechas específicas
        for (let i = 6; i >= 0; i--) {
          const fecha = new Date(hoy.getTime() - (i * 24 * 60 * 60 * 1000));
          const dia = fecha.getDate().toString().padStart(2, '0');
          const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
          const año = fecha.getFullYear();
          
          const fechaKey = `${dia}-${mes}-${año}`;
          const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          const nombreDia = diasSemana[fecha.getDay()];
          const label = `${nombreDia} ${dia}/${mes}`;
          
          fechasLabels.push(label);
          estadisticasPorFecha[fechaKey] = 0;
        }

        sesiones.forEach(sesion => {
          const [dia, mes, año] = sesion.fecha.split('-').map(Number);
          const fechaSesion = new Date(año, mes - 1, dia);
          const fechaInicio = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
          
          if (fechaSesion >= fechaInicio && fechaSesion <= hoy) {
            const diaStr = dia.toString().padStart(2, '0');
            const mesStr = mes.toString().padStart(2, '0');
            const fechaKey = `${diaStr}-${mesStr}-${año}`;
            
            if (estadisticasPorFecha.hasOwnProperty(fechaKey)) {
              estadisticasPorFecha[fechaKey]++;
            }
          }
        });

        datos = fechasLabels.map((label, index) => {
          const fechaKey = Object.keys(estadisticasPorFecha)[index];
          return {
            periodo: label,
            cantidad: estadisticasPorFecha[fechaKey] || 0
          };
        });
        break;

      case 'mensual':
        // Últimas 4 semanas con rangos de fechas
        const estadisticasPorSemanaRango: Record<string, { label: string; inicio: Date; fin: Date; cantidad: number }> = {};
        const semanasRangoLabels: string[] = [];
        
        // Generar las últimas 4 semanas con rangos de fechas
        for (let i = 3; i >= 0; i--) {
          const inicioSemana = new Date(hoy.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
          // Ajustar al lunes de esa semana
          const diaSemana = inicioSemana.getDay();
          const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
          inicioSemana.setDate(inicioSemana.getDate() - diasHastaLunes);
          
          const finSemana = new Date(inicioSemana.getTime() + (6 * 24 * 60 * 60 * 1000));
          
          const diaInicio = inicioSemana.getDate().toString().padStart(2, '0');
          const diaFin = finSemana.getDate().toString().padStart(2, '0');
          
          // Si están en el mismo mes, mostrar "1-7 Dic", si no "28 Nov-4 Dic"
          let label: string;
          if (inicioSemana.getMonth() === finSemana.getMonth()) {
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const nombreMes = meses[inicioSemana.getMonth()];
            label = `${parseInt(diaInicio)}-${parseInt(diaFin)} ${nombreMes}`;
          } else {
            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const nombreMesInicio = meses[inicioSemana.getMonth()];
            const nombreMesFin = meses[finSemana.getMonth()];
            label = `${parseInt(diaInicio)} ${nombreMesInicio}-${parseInt(diaFin)} ${nombreMesFin}`;
          }
          
          semanasRangoLabels.push(label);
          estadisticasPorSemanaRango[label] = {
            label,
            inicio: new Date(inicioSemana),
            fin: new Date(finSemana),
            cantidad: 0
          };
        }

        sesiones.forEach(sesion => {
          const [dia, mes, año] = sesion.fecha.split('-').map(Number);
          const fechaSesion = new Date(año, mes - 1, dia);
          
          // Buscar en qué semana cae esta sesión
          Object.values(estadisticasPorSemanaRango).forEach(semanaData => {
            if (fechaSesion >= semanaData.inicio && fechaSesion <= semanaData.fin) {
              semanaData.cantidad++;
            }
          });
        });

        datos = semanasRangoLabels.map(label => ({
          periodo: label,
          cantidad: estadisticasPorSemanaRango[label].cantidad
        }));
        break;

      case 'trimestral':
        // Últimos 4 trimestres
        const estadisticasPorTrimestre: Record<string, number> = {};
        const trimestresLabels: string[] = [];
        
        // Generar los últimos 4 trimestres
        for (let i = 3; i >= 0; i--) {
          const fechaTrimestre = new Date(hoy.getFullYear(), hoy.getMonth() - (i * 3), 1);
          const trimestreNum = getQuarter(fechaTrimestre.getMonth() + 1);
          const año = fechaTrimestre.getFullYear();
          
          const trimestreTexto = trimestreNum === 1 ? '1er' : 
                                trimestreNum === 2 ? '2do' :
                                trimestreNum === 3 ? '3er' : '4to';
          const label = `${trimestreTexto} Trimestre ${año}`;
          trimestresLabels.push(label);
          estadisticasPorTrimestre[label] = 0;
        }

        sesiones.forEach(sesion => {
          const [, mes, año] = sesion.fecha.split('-').map(Number);
          const trimestreNum = getQuarter(mes);
          
          const trimestreTexto = trimestreNum === 1 ? '1er' : 
                                trimestreNum === 2 ? '2do' :
                                trimestreNum === 3 ? '3er' : '4to';
          const labelTrimestre = `${trimestreTexto} Trimestre ${año}`;
          
          if (estadisticasPorTrimestre.hasOwnProperty(labelTrimestre)) {
            estadisticasPorTrimestre[labelTrimestre]++;
          }
        });

        datos = trimestresLabels.map(trimestre => ({
          periodo: trimestre,
          cantidad: estadisticasPorTrimestre[trimestre]
        }));
        break;

      case 'semestral':
        // Últimos 4 semestres
        const estadisticasPorSemestre: Record<string, number> = {};
        const semestresLabels: string[] = [];
        
        // Generar los últimos 4 semestres
        for (let i = 3; i >= 0; i--) {
          const fechaSemestre = new Date(hoy.getFullYear(), hoy.getMonth() - (i * 6), 1);
          const semestreNum = getSemester(fechaSemestre.getMonth() + 1);
          const año = fechaSemestre.getFullYear();
          const label = `${semestreNum}${semestreNum === 1 ? 'er' : 'do'} Semestre ${año}`;
          semestresLabels.push(label);
          estadisticasPorSemestre[label] = 0;
        }

        sesiones.forEach(sesion => {
          const [, mes, año] = sesion.fecha.split('-').map(Number);
          const semestreNum = getSemester(mes);
          const labelSemestre = `${semestreNum}${semestreNum === 1 ? 'er' : 'do'} Semestre ${año}`;
          
          if (estadisticasPorSemestre.hasOwnProperty(labelSemestre)) {
            estadisticasPorSemestre[labelSemestre]++;
          }
        });

        datos = semestresLabels.map(semestre => ({
          periodo: semestre,
          cantidad: estadisticasPorSemestre[semestre]
        }));
        break;

      case 'anual':
        // Últimos 3 años (2 años atrás + año actual)
        const estadisticasPorAño: Record<string, number> = {};
        const añosLabels: string[] = [];
        
        // Generar los últimos 3 años
        for (let i = 2; i >= 0; i--) {
          const año = hoy.getFullYear() - i;
          añosLabels.push(año.toString());
          estadisticasPorAño[año.toString()] = 0;
        }

        sesiones.forEach(sesion => {
          const [, , año] = sesion.fecha.split('-').map(Number);
          const labelAño = año.toString();
          
          if (estadisticasPorAño.hasOwnProperty(labelAño)) {
            estadisticasPorAño[labelAño]++;
          }
        });

        datos = añosLabels.map(año => ({
          periodo: año,
          cantidad: estadisticasPorAño[año]
        }));
        break;
    }

    // Calcular total de sesiones en los datos mostrados
    const totalSesiones = datos.reduce((sum, dato) => sum + dato.cantidad, 0);

    return {
      success: true,
      datos,
      totalSesiones,
      filtro
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas por día:', error);
    return {
      success: false,
      datos: [],
      totalSesiones: 0,
      filtro,
      error: 'Error al obtener estadísticas por día'
    };
  }
}

// Funciones para gestionar categorías
export async function getCategorias() {
  try {
    const categoriasList = await db.select().from(categorias).orderBy(categorias.nombre);
    return { success: true, data: categoriasList };
  } catch (error) {
    console.error("Error getting categories:", error);
    return { success: false, message: "Error al obtener las categorías." };
  }
}

export async function createCategoria(data: FormData) {
  try {
    const newCategoria = {
      id: crypto.randomUUID(),
      nombre: data.get("nombre") as string,
      descripcion: data.get("descripcion") as string || null,
      created_at: new Date().toISOString(),
    };

    await db.insert(categorias).values(newCategoria);
    revalidatePath("/");
    return { success: true, message: "Categoría creada con éxito." };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, message: "Error al crear la categoría." };
  }
}

export async function updateCategoria(id: string, data: FormData) {
  try {
    const updatedCategoria = {
      nombre: data.get("nombre") as string,
      descripcion: data.get("descripcion") as string || null,
    };

    await db.update(categorias).set(updatedCategoria).where(eq(categorias.id, id));
    revalidatePath("/");
    return { success: true, message: "Categoría actualizada con éxito." };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, message: "Error al actualizar la categoría." };
  }
}

export async function deleteCategoria(id: string) {
  try {
    // Verificar si hay pacientes usando esta categoría
    const pacientesConCategoria = await db
      .select({ count: sql<number>`count(*)` })
      .from(pacientes)
      .where(eq(pacientes.categoria_id, id));

    if (pacientesConCategoria[0]?.count > 0) {
      return { 
        success: false, 
        message: "No se puede eliminar la categoría porque hay pacientes asignados a ella." 
      };
    }

    await db.delete(categorias).where(eq(categorias.id, id));
    revalidatePath("/");
    return { success: true, message: "Categoría eliminada con éxito." };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, message: "Error al eliminar la categoría." };
  }
}

// Funciones para gestionar obras sociales
export async function getObrasSociales() {
  try {
    const obrasSocialesList = await db.select().from(obras_sociales).orderBy(obras_sociales.nombre);
    return { success: true, data: obrasSocialesList };
  } catch (error) {
    console.error("Error getting obras sociales:", error);
    return { success: false, message: "Error al obtener las obras sociales." };
  }
}

export async function createObraSocial(data: FormData) {
  try {
    const newObraSocial = {
      id: crypto.randomUUID(),
      nombre: data.get("nombre") as string,
      descripcion: data.get("descripcion") as string || null,
      created_at: new Date().toISOString(),
    };

    await db.insert(obras_sociales).values(newObraSocial);
    revalidatePath("/");
    return { success: true, message: "Obra social creada con éxito." };
  } catch (error) {
    console.error("Error creating obra social:", error);
    return { success: false, message: "Error al crear la obra social." };
  }
}

export async function updateObraSocial(id: string, data: FormData) {
  try {
    const updatedObraSocial = {
      nombre: data.get("nombre") as string,
      descripcion: data.get("descripcion") as string || null,
    };

    await db.update(obras_sociales).set(updatedObraSocial).where(eq(obras_sociales.id, id));
    revalidatePath("/");
    return { success: true, message: "Obra social actualizada con éxito." };
  } catch (error) {
    console.error("Error updating obra social:", error);
    return { success: false, message: "Error al actualizar la obra social." };
  }
}

export async function deleteObraSocial(id: string) {
  try {
    // Verificar si hay pacientes usando esta obra social
    const pacientesConObraSocial = await db
      .select({ count: sql<number>`count(*)` })
      .from(pacientes)
      .where(eq(pacientes.obra_social_id, id));

    if (pacientesConObraSocial[0]?.count > 0) {
      return { 
        success: false, 
        message: "No se puede eliminar la obra social porque hay pacientes asignados a ella." 
      };
    }

    await db.delete(obras_sociales).where(eq(obras_sociales.id, id));
    revalidatePath("/");
    return { success: true, message: "Obra social eliminada con éxito." };
  } catch (error) {
    console.error("Error deleting obra social:", error);
    return { success: false, message: "Error al eliminar la obra social." };
  }
}

// Funciones para estadísticas de administración
export async function getEstadisticasAdministracion() {
  try {
    const [obrasSocialesCount, categoriasCount, pacientesCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(obras_sociales),
      db.select({ count: sql<number>`count(*)` }).from(categorias),
      db.select({ count: sql<number>`count(*)` }).from(pacientes)
    ]);

    return {
      success: true,
      data: {
        obrasSociales: obrasSocialesCount[0]?.count || 0,
        categorias: categoriasCount[0]?.count || 0,
        pacientes: pacientesCount[0]?.count || 0
      }
    };
  } catch (error) {
    console.error("Error getting admin statistics:", error);
    return { 
      success: false, 
      data: { obrasSociales: 0, categorias: 0, pacientes: 0 },
      message: "Error al obtener estadísticas." 
    };
  }
}


