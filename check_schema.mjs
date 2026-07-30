import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const conn = await createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('DESCRIBE representatives');
const dbFields = rows.map(r => r.Field);

// Schema fields from schema.ts
const schemaFields = ['id','userId','fullName','phone','region','segment','experienceYears','bio','availability','workModel','portfolioSize','linkedinUrl','avatarUrl','cities','additionalSegments','highlightedAt','kycStatus','kycDocumentUrl','kycSelfieUrl','kycDocumentType','kycExtractedName','kycExtractedCpf','kycNotes','kycFaceMatchScore','kycFaceMatchResult','kycReviewedAt','cnpj','cpf','coreNumber','coreState','coreStatus','coreDocUrl','coreValidUntil','coreCheckedAt','subscriptionTier','stripeCustomerId','stripeSubscriptionId','isActive','responseRate','averageRating','email','nomeFantasia','cidade','estado','cep','situacaoCadastral','dataAbertura','naturezaJuridica','porte','capitalSocial','simplesNacional','mei','cnaeDescricao','socios','cnpjaRawJson','cnpjaUpdatedAt','createdAt','updatedAt'];

const missing = schemaFields.filter(f => !dbFields.includes(f));
const extra = dbFields.filter(f => !schemaFields.includes(f));
console.log('DB fields:', dbFields.length);
console.log('Missing in DB (in schema but not DB):', missing);
console.log('Extra in DB (in DB but not schema):', extra);

await conn.end();
