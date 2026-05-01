import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function VerificarEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("no-token");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data: { success?: boolean; error?: string; message?: string }) => {
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "E-mail verificado com sucesso!");
        } else {
          setStatus("error");
          setMessage(data.error || "Erro ao verificar e-mail.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Erro de conexão. Tente novamente.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verificação de E-mail</CardTitle>
            <CardDescription>RepMatch</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-4">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Verificando seu e-mail...</p>
              </div>
            )}
            {status === "success" && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <h3 className="font-semibold text-lg">E-mail verificado!</h3>
                <p className="text-muted-foreground text-sm">{message}</p>
                <Link href="/login">
                  <Button className="mt-2 w-full">Ir para o login</Button>
                </Link>
              </div>
            )}
            {status === "error" && (
              <div className="flex flex-col items-center gap-3">
                <XCircle className="w-12 h-12 text-destructive" />
                <h3 className="font-semibold text-lg">Erro na verificação</h3>
                <p className="text-muted-foreground text-sm">{message}</p>
                <Link href="/login">
                  <Button variant="outline" className="mt-2 w-full">Voltar para o login</Button>
                </Link>
              </div>
            )}
            {status === "no-token" && (
              <div className="flex flex-col items-center gap-3">
                <XCircle className="w-12 h-12 text-destructive" />
                <h3 className="font-semibold text-lg">Link inválido</h3>
                <p className="text-muted-foreground text-sm">
                  Este link de verificação é inválido. Solicite um novo link de verificação.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="mt-2 w-full">Voltar para o login</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
