import fs from 'node:fs';
const required=['config/route-atlas.json','config/rbac.json','config/entra-id.json','config/ai-governance.json','config/data-migration.json','config/departments.json','config/curriculum-platform.json','app/page.tsx','app/layout.tsx','vercel.json'];
for(const p of required){if(!fs.existsSync(p)) throw new Error(`Missing ${p}`)}
for(const p of ['config/route-atlas.json','config/rbac.json','config/entra-id.json','config/ai-governance.json','config/data-migration.json','config/departments.json','config/curriculum-platform.json']) JSON.parse(fs.readFileSync(p,'utf8'));
console.log(`Validated ${required.length} foundation files.`);