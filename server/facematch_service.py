"""
Face Match Microservice — RepMatch KYC
Compara foto do documento (CNH/RG) com selfie usando DeepFace (ArcFace model)
Endpoint: POST /facematch  { "image1_b64": "...", "image2_b64": "..." }
Returns: { "match": bool, "similarity": float, "confidence": "high"|"medium"|"low" }
"""
from flask import Flask, request, jsonify
import base64
import tempfile
import os
import sys

app = Flask(__name__)

def decode_b64_to_file(b64_str: str, suffix: str = ".jpg") -> str:
    """Decodifica base64 para arquivo temporário e retorna o caminho."""
    # Remove prefixo data:image/...;base64,
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    data = base64.b64decode(b64_str)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(data)
    tmp.close()
    return tmp.name

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "facematch"})

@app.route("/facematch", methods=["POST"])
def facematch():
    try:
        body = request.get_json(force=True)
        if not body or "image1_b64" not in body or "image2_b64" not in body:
            return jsonify({"error": "Campos obrigatórios: image1_b64, image2_b64"}), 400

        # Salvar imagens em arquivos temporários
        img1_path = decode_b64_to_file(body["image1_b64"])
        img2_path = decode_b64_to_file(body["image2_b64"])

        try:
            from deepface import DeepFace

            # Usar ArcFace — melhor precisão para documentos (99.4% LFW)
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name="ArcFace",
                detector_backend="opencv",
                enforce_detection=False,  # não falha se não detectar rosto
                silent=True,
            )

            is_match = result.get("verified", False)
            distance = result.get("distance", 1.0)
            threshold = result.get("threshold", 0.68)

            # Calcular similarity: 0.0 (muito diferente) → 1.0 (idêntico)
            # ArcFace usa cosine distance: similarity = 1 - distance
            similarity = max(0.0, min(1.0, 1.0 - distance))

            # Nível de confiança
            if similarity >= 0.80:
                confidence = "high"
            elif similarity >= 0.60:
                confidence = "medium"
            else:
                confidence = "low"

            return jsonify({
                "match": is_match,
                "similarity": round(similarity, 4),
                "distance": round(distance, 4),
                "threshold": round(threshold, 4),
                "confidence": confidence,
                "model": "ArcFace",
            })

        finally:
            # Limpar arquivos temporários
            try:
                os.unlink(img1_path)
                os.unlink(img2_path)
            except Exception:
                pass

    except Exception as e:
        error_msg = str(e)
        # Erros comuns de detecção de rosto
        if "Face could not be detected" in error_msg or "No face detected" in error_msg:
            return jsonify({
                "match": False,
                "similarity": 0.0,
                "confidence": "low",
                "error": "Rosto não detectado em uma ou ambas as imagens. Certifique-se de que o rosto está visível e bem iluminado.",
            }), 422
        return jsonify({"error": f"Erro interno: {error_msg}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("FACEMATCH_PORT", 5001))
    print(f"[FaceMatch] Iniciando serviço na porta {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
