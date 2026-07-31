import mysql from 'mysql2/promise';

const conn = await mysql.createConnection('mysql://root:NyZjLWRreAZkcnqvuGtrcYJnfXrIzSMT@autorack.proxy.rlwy.net:22823/railway');

const repQuery = `
  SELECT
    r.id AS id,
    'rep' AS source,
    0 AS source_priority,
    r.fullName AS fullName,
    r.phone AS phone,
    r.region AS region,
    r.segment AS segment,
    r.experienceYears AS experienceYears,
    r.bio AS bio,
    r.subscriptionTier AS subscriptionTier,
    CAST(r.averageRating AS DECIMAL(3,2)) AS avg_rating,
    CAST(r.responseRate AS DECIMAL(5,2)) AS responseRate,
    r.availability AS availability,
    r.workModel AS workModel,
    r.portfolioSize AS portfolioSize,
    r.linkedinUrl AS linkedinUrl,
    r.avatarUrl AS avatarUrl,
    r.cities AS cities,
    r.additionalSegments AS additionalSegments,
    r.highlightedAt AS highlightedAt,
    r.createdAt AS created_at,
    r.email AS email,
    r.cidade AS cidade,
    r.estado AS estado,
    r.situacaoCadastral AS situacaoCadastral,
    r.cnpj AS cnpj,
    r.nomeFantasia AS nomeFantasia,
    r.kycStatus AS kycStatus,
    r.coreStatus AS coreStatus,
    CASE r.subscriptionTier WHEN 'ouro' THEN 1 WHEN 'prata' THEN 2 WHEN 'bronze' THEN 3 ELSE 4 END AS tier_order,
    CASE r.availability WHEN 'imediata' THEN 1 WHEN '30dias' THEN 2 WHEN '60dias' THEN 3 WHEN 'negociavel' THEN 4 ELSE 5 END AS avail_order
  FROM representatives r
  WHERE r.isActive = 1
`;

const cnpjQuery = `
  SELECT
    (c.id + 100000) AS id,
    'cnpj' AS source,
    1 AS source_priority,
    COALESCE(c.nome_fantasia, c.razao_social) AS fullName,
    c.telefone AS phone,
    c.uf AS region,
    c.cnae_descricao AS segment,
    5 AS experienceYears,
    NULL AS bio,
    'free' AS subscriptionTier,
    0.00 AS avg_rating,
    0.00 AS responseRate,
    'negociavel' AS availability,
    'multiplas' AS workModel,
    NULL AS portfolioSize,
    NULL AS linkedinUrl,
    NULL AS avatarUrl,
    NULL AS cities,
    NULL AS additionalSegments,
    NULL AS highlightedAt,
    c.created_at,
    c.email AS email,
    c.municipio AS cidade,
    c.uf AS estado,
    'Ativa' AS situacaoCadastral,
    c.cnpj AS cnpj,
    COALESCE(c.nome_fantasia, c.razao_social) AS nomeFantasia,
    'not_started' AS kycStatus,
    'not_checked' AS coreStatus,
    4 AS tier_order,
    5 AS avail_order
  FROM cnpj_representatives c
  WHERE 1=1
`;

const start = Date.now();
try {
  // Test COUNT first
  const [countRows] = await conn.execute(`SELECT COUNT(*) as total FROM (${repQuery} UNION ALL ${cnpjQuery}) AS combined`);
  console.log('COUNT:', countRows[0].total, 'em', Date.now()-start, 'ms');
  
  // Test page query
  const start2 = Date.now();
  const [rows] = await conn.execute(`SELECT * FROM (${repQuery} UNION ALL ${cnpjQuery}) AS combined ORDER BY source_priority ASC, tier_order ASC LIMIT 20 OFFSET 0`);
  console.log('SELECT 20:', rows.length, 'rows em', Date.now()-start2, 'ms');
  console.log('Primeiro:', JSON.stringify(rows[0]).substring(0, 300));
} catch(e) {
  console.error('ERRO:', e.message);
}

await conn.end();
