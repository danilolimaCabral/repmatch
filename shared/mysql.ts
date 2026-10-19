type InsertResult = { insertId?: unknown };

/**
 * Extrai o insertId retornado por mysql2/Drizzle e devolve null quando não há
 * um identificador utilizável. Evita enviar `null`/`NaN` em pagamentos.
 */
export function getMySqlInsertId(result: unknown): number | null {
  const candidate = Array.isArray(result) ? result[0] : result;
  if (!candidate || typeof candidate !== "object") return null;
  const id = Number((candidate as InsertResult).insertId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
