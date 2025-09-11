import { getPaciente } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { EditPacienteForm } from "@/components/edit-paciente-form";
import { ArrowLeft, Edit } from "lucide-react";

export default async function EditarPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paciente = await getPaciente(id);

  if (!paciente) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8 px-4 md:px-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Paciente no encontrado</h1>
          <Link href="/pacientes">
            <Button variant="outline" className="mt-4">Volver al listado</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header con navegación */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/paciente/${paciente.id}`}>
            <Button variant="outline" size="sm" className="gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Edit className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Editar Paciente
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-muted-foreground/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-muted-foreground/10">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Edit className="h-5 w-5 text-primary" />
                Información del Paciente
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Modifica los datos del paciente según sea necesario
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <EditPacienteForm paciente={paciente} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}