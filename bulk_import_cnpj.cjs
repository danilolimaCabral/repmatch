// Bulk import CNPJ representatives CSV into database
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

async function main() {
    console.log('Connecting to DB...');
    const conn = await mysql.createConnection(url);
    
    const [existing] = await conn.execute('SELECT COUNT(*) as cnt FROM cnpj_representatives');
    console.log('Existing rows:', existing[0].cnt);
    
    if (existing[0].cnt > 0) {
        console.log('Table already has data, skipping import');
        await conn.end();
        return;
    }
    
    const csvPath = '/home/ubuntu/cnpj_import/representantes_brasil.csv';
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');
    console.log('Total lines in CSV:', lines.length);
    
    let batch = [];
    let total = 0;
    let errors = 0;
    const BATCH_SIZE = 2000;
    
    async function flushBatch() {
        if (batch.length === 0) return;
        const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
        const values = batch.flat();
        try {
            await conn.execute(
                `INSERT IGNORE INTO cnpj_representatives 
                (cnpj, razao_social, nome_fantasia, porte, is_mei, cnae_principal, cnae_descricao, uf, municipio, cep, logradouro, telefone, email, data_abertura, data_situacao, cnpj_updated_at)
                VALUES ${placeholders}`,
                values
            );
            total += batch.length;
            if (total % 20000 === 0) console.log(`Imported ${total} rows...`);
        } catch(e) {
            errors++;
            if (errors <= 3) console.error('Batch error:', e.message.substring(0, 150));
        }
        batch = [];
    }
    
    const parseDate = (s) => {
        if (!s || s.trim() === '' || s.trim() === 'None') return null;
        return s.trim().substring(0, 10);
    };
    const parseDatetime = (s) => {
        if (!s || s.trim() === '' || s.trim() === 'None') return null;
        return s.trim().substring(0, 19).replace('T', ' ');
    };
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = line.split(',');
        if (fields.length < 14) continue;
        
        const [cnpj, razao_social, nome_fantasia, porte, is_mei, cnae_principal, cnae_descricao, uf, municipio, cep, logradouro, telefone, email, data_abertura, data_situacao, updated_at] = fields;
        
        if (!cnpj || cnpj.length < 14) continue;
        
        batch.push([
            cnpj || null,
            razao_social || null,
            nome_fantasia || null,
            porte || null,
            parseInt(is_mei) || 0,
            cnae_principal || null,
            cnae_descricao || null,
            uf || null,
            municipio || null,
            cep || null,
            logradouro || null,
            telefone || null,
            email || null,
            parseDate(data_abertura),
            parseDate(data_situacao),
            parseDatetime(updated_at)
        ]);
        
        if (batch.length >= BATCH_SIZE) {
            await flushBatch();
        }
    }
    
    await flushBatch();
    
    const [final] = await conn.execute('SELECT COUNT(*) as cnt FROM cnpj_representatives');
    console.log(`\nImport complete! Total rows in DB: ${final[0].cnt}, Errors: ${errors}`);
    
    await conn.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
