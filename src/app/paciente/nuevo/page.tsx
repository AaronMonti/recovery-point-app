import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CreatePacienteForm } from "@/components/create-paciente-form";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function NuevoPaciente() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header con navegación */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/pacientes">
            <Button variant="outline" size="sm" className="gap-2 shadow-sm">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Nuevo Paciente
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-muted-foreground/20 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-5 w-5 text-primary" />
                Información del Paciente
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Completa los datos del nuevo paciente para comenzar su seguimiento
              </p>
            </CardHeader>
            <CardContent>
              <CreatePacienteForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}