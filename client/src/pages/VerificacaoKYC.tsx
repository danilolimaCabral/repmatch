import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Shield, CheckCircle, Clock, XCircle, Upload, Camera,
  FileText, User, AlertTriangle, ArrowLeft, Award, Info
} from "lucide-react";

const STATES = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    not_started: { label: "Não iniciada", color: "bg-gray-100 text-gray-700", icon: <Shield className="w-3 h-3" /> },
    pending_review: { label: "Em análise", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
    approved: { label: "Verificado ✓", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
    rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status] || map.not_started;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

function CoreStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    not_checked: { label: "Não verificado", color: "bg-gray-100 text-gray-700" },
    active: { label: "CORE Ativo ✓", color: "bg-green-100 text-green-800" },
    inactive: { label: "CORE Inativo", color: "bg-red-100 text-red-800" },
    not_found: { label: "Não encontrado", color: "bg-orange-100 text-orange-800" },
  };
  const s = map[status] || map.not_checked;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
      <Award className="w-3 h-3" /> {s.label}
    </span>
  );
}

export default function VerificacaoKYC() {
  const [step, setStep] = useState<"status" | "document" | "selfie" | "core" | "done">("status");
  const [documentType, setDocumentType] = useState<"rg" | "cnh" | "passaporte">("cnh");
  const [documentBase64, setDocumentBase64] = useState<string>("");
  const [selfieBase64, setSelfieBase64] = useState<string>("");
  const [coreNumber, setCoreNumber] = useState("");
  const [coreState, setCoreState] = useState("SP");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: kycStatus, refetch } = trpc.kyc.getStatus.useQuery(undefined, {
    retry: false,
  });

  const submitDocuments = trpc.kyc.submitDocuments.useMutation({
    onSuccess: (data) => {
      toast.success("Documentos enviados! Sua verificação está em análise. Retorno em até 24h.");
      setStep("done");
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao enviar documentos: " + err.message);
    },
  });

  const lookupCore = trpc.kyc.lookupCore.useMutation({
    onSuccess: (data) => {
      if (data.coreStatus === "active") {
        toast.success(`CORE verificado! Registro ativo${data.coreValidUntil ? ` — válido até ${data.coreValidUntil}` : ""}`);
      } else if (data.coreStatus === "inactive") {
        toast.error("CORE inativo: Seu registro no CORE está inativo ou suspenso.");
      } else {
        toast.error("CORE não encontrado: Número não localizado no CONFERE. Verifique os dados.");
      }
      refetch();
    },
    onError: (err) => {
      toast.error("Erro na consulta CORE: " + err.message);
    },
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    const b64 = await fileToBase64(file);
    setDocumentBase64(b64);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      toast.error("Câmera não disponível. Faça upload de uma foto da selfie.");
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const b64 = canvas.toDataURL("image/jpeg", 0.8);
    setSelfieBase64(b64);
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  }, []);

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setSelfieBase64(b64);
  };

  const handleSubmit = () => {
    if (!documentBase64 || !selfieBase64) {
      toast.error("Documentos incompletos. Envie o documento e a selfie.");
      return;
    }
    submitDocuments.mutate({
      documentType,
      documentBase64,
      selfieBase64,
      coreNumber: coreNumber || undefined,
      coreState: coreState || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/rep">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Verificação de Identidade</h1>
              <p className="text-gray-400 text-sm">Torne-se um representante verificado e aumente sua credibilidade</p>
            </div>
          </div>
        </div>

        {/* Benefits Banner */}
        <Card className="bg-emerald-900/20 border-emerald-800/50 mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-1">Por que verificar?</p>
                <ul className="text-xs text-emerald-200/80 space-y-1">
                  <li>✓ Badge "Identidade Verificada" no seu perfil</li>
                  <li>✓ Prioridade nos resultados de busca das empresas</li>
                  <li>✓ Maior taxa de contato e confiança</li>
                  <li>✓ Acesso a vagas exclusivas para representantes verificados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        {kycStatus && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Identidade</p>
                  <StatusBadge status={kycStatus.kycStatus} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">CORE</p>
                  <CoreStatusBadge status={kycStatus.coreStatus} />
                </div>
                {kycStatus.coreValidUntil && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Validade CORE</p>
                    <span className="text-xs text-white">{kycStatus.coreValidUntil}</span>
                  </div>
                )}
                {kycStatus.coreNumber && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Nº Registro</p>
                    <span className="text-xs text-white">{kycStatus.coreNumber}/{kycStatus.coreState}</span>
                  </div>
                )}
              </div>
              {kycStatus.kycStatus === "pending_review" && (
                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-lg">
                  <p className="text-xs text-yellow-300">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Seus documentos estão em análise. Retorno em até 24 horas úteis.
                  </p>
                </div>
              )}
              {kycStatus.kycStatus === "rejected" && kycStatus.kycNotes && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
                  <p className="text-xs text-red-300">
                    <XCircle className="w-3 h-3 inline mr-1" />
                    {kycStatus.kycNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step: Document Upload */}
        {(kycStatus?.kycStatus === "not_started" || kycStatus?.kycStatus === "rejected" || !kycStatus) && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Passo 1 — Documento de Identidade
              </CardTitle>
              <CardDescription>Envie uma foto clara do seu RG, CNH ou Passaporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">Tipo de documento</Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as any)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cnh">CNH — Carteira Nacional de Habilitação</SelectItem>
                    <SelectItem value="rg">RG — Registro Geral</SelectItem>
                    <SelectItem value="passaporte">Passaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">Foto do documento (frente)</Label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-emerald-600 transition-colors bg-gray-800/50">
                  {documentBase64 ? (
                    <img src={documentBase64} alt="Documento" className="h-full w-full object-contain rounded-lg p-1" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Clique para enviar (JPG, PNG, max 5MB)</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleDocumentUpload} />
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Selfie */}
        {(kycStatus?.kycStatus === "not_started" || kycStatus?.kycStatus === "rejected" || !kycStatus) && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                Passo 2 — Selfie ao Vivo
              </CardTitle>
              <CardDescription>Tire uma selfie segurando o documento para confirmar que é você</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cameraActive ? (
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded-lg" autoPlay muted playsInline />
                  <Button onClick={capturePhoto} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">
                    <Camera className="w-4 h-4 mr-2" /> Capturar Foto
                  </Button>
                </div>
              ) : selfieBase64 ? (
                <div>
                  <img src={selfieBase64} alt="Selfie" className="w-full h-48 object-contain rounded-lg bg-gray-800" />
                  <Button variant="outline" onClick={() => setSelfieBase64("")} className="w-full mt-2 border-gray-700">
                    Refazer selfie
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={startCamera} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Camera className="w-4 h-4 mr-2" /> Usar câmera
                  </Button>
                  <label className="flex-1">
                    <Button variant="outline" className="w-full border-gray-700" asChild>
                      <span><Upload className="w-4 h-4 mr-2" /> Upload de foto</span>
                    </Button>
                    <input type="file" className="hidden" accept="image/*" onChange={handleSelfieUpload} />
                  </label>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              <p className="text-xs text-gray-500">
                <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-500" />
                Segure o documento ao lado do rosto. Certifique-se de que ambos estejam visíveis e legíveis.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step: CORE */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Passo 3 — Registro no CORE (opcional)
            </CardTitle>
            <CardDescription>
              Verifique seu registro no Conselho Regional dos Representantes Comerciais para obter o badge CORE Ativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">Nº de Registro CORE</Label>
                <Input
                  value={coreNumber}
                  onChange={e => setCoreNumber(e.target.value)}
                  placeholder="Ex: 12345"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-300 mb-2 block">Estado do CORE</Label>
                <Select value={coreState} onValueChange={setCoreState}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-amber-700 text-amber-400 hover:bg-amber-900/20"
              disabled={!coreNumber || lookupCore.isPending}
              onClick={() => lookupCore.mutate({ coreNumber, coreState })}
            >
              {lookupCore.isPending ? (
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 animate-spin" /> Consultando CONFERE...</span>
              ) : (
                <span className="flex items-center gap-2"><Award className="w-4 h-4" /> Verificar CORE agora</span>
              )}
            </Button>
            {kycStatus?.coreStatus === "active" && (
              <div className="p-3 bg-green-900/20 border border-green-800/40 rounded-lg">
                <p className="text-xs text-green-300">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  CORE verificado e ativo{kycStatus.coreValidUntil ? ` — válido até ${kycStatus.coreValidUntil}` : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        {(kycStatus?.kycStatus === "not_started" || kycStatus?.kycStatus === "rejected" || !kycStatus) && (
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-base font-semibold"
            disabled={!documentBase64 || !selfieBase64 || submitDocuments.isPending}
            onClick={handleSubmit}
          >
            {submitDocuments.isPending ? (
              <span className="flex items-center gap-2"><Clock className="w-5 h-5 animate-spin" /> Enviando e analisando com IA...</span>
            ) : (
              <span className="flex items-center gap-2"><Shield className="w-5 h-5" /> Enviar para verificação</span>
            )}
          </Button>
        )}

        {kycStatus?.kycStatus === "approved" && (
          <Card className="bg-green-900/20 border-green-800/50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-300">Identidade Verificada!</h3>
              <p className="text-sm text-green-200/80 mt-1">
                Seu perfil agora exibe o badge de representante verificado. Isso aumenta significativamente suas chances de ser contactado por empresas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
