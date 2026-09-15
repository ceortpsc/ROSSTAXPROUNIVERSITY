#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'server/server.ts',
  'server/ai-lms-routes.ts',
  'server/platform-routes.ts',
  'web/index.html',
  'web/src/main.tsx',
  'web/src/App.tsx',
  'web/src/AiUniversityPages.tsx',
  'web/src/styles.css',
  'lib/andreaa-engine.ts',
  'lib/andreaa-channel.ts',
  'lib/ai-university.ts',
  'lib/lms-integration.ts',
  'openapi/andreaa-channel.openapi.yaml',
  'openapi/ai-lms.openapi.yaml',
  'docs/andreaa-channel/PRODUCTION-ENGINEERING-MANUAL.md',
  'docs/andreaa-channel/GOVERNANCE-RBAC.md',
  'docs/andreaa-channel/LMS-INTEGRATION.md',
  'docs/architecture/AI-UNIVERSITY-V4.md',
  'docs/andreaa-channel/RUNBOOK.md'
];

const requiredEnv = ['RTPU_DEPLOY_ENV'];
const recommendedEnv = [
  'PUBLIC_BASE_URL',
  'RTPU_SUPPORT_EMAIL',
  'OPS_ADMIN_KEY',
  'RTPU_RELEASE_CHANNEL',
  'RTPU_AI_LMS_ENABLED',
  'RTPU_AI_LMS_MODE',
  'RTPU_AI_LECTURE_ENABLED',
  'RTPU_AI_ASSESSMENT_ENABLED',
  'RTPU_AI_TUTORING_ENABLED',
  'RTPU_AI_AGENT_MESH_ENABLED'
];

function pass(label, details = '') { console.log(`PASS  ${label}${details ? ` - ${details}` : ''}`); }
function warn(label, details = '') { console.log(`WARN  ${label}${details ? ` - ${details}` : ''}`); }
function fail(label, details = '') { console.error(`FAIL  ${label}${details ? ` - ${details}` : ''}`); process.exitCode = 1; }

console.log('RTPU AI University runtime-v4 production preflight');
console.log('------------------------------------------------');

for (const file of requiredFiles) {
  existsSync(file) ? pass(`file:${file}`) : fail(`file:${file}`, 'missing');
}

for (const name of requiredEnv) {
  process.env[name] ? pass(`env:${name}`, 'set') : fail(`env:${name}`, 'required');
}

for (const name of recommendedEnv) {
  process.env[name] ? pass(`env:${name}`, 'set') : warn(`env:${name}`, 'not set in this shell');
}

try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const version = execFileSync(process.execPath, ['--version'], { encoding: 'utf8' }).trim();
  pass('node', version);
  if (!pkg.engines?.node) warn('package.engines.node', 'not declared');
  else pass('package.engines.node', pkg.engines.node);

  if (pkg.dependencies?.next || pkg.devDependencies?.next) fail('runtime.framework', 'Next.js dependency still present');
  else pass('runtime.framework', 'Fastify + Vite; no Next.js package dependency');

  if (pkg.version !== '4.0.0') warn('package.version', `expected 4.0.0, received ${pkg.version}`);
  else pass('package.version', pkg.version);

  for (const dependency of ['fastify', '@fastify/static', '@fastify/helmet', '@fastify/compress', 'react', 'react-dom']) {
    if (pkg.dependencies?.[dependency]) pass(`dependency:${dependency}`, pkg.dependencies[dependency]);
    else fail(`dependency:${dependency}`, 'missing');
  }

  for (const script of ['dev', 'build', 'start', 'typecheck', 'andreaa', 'preflight', 'deploy:production']) {
    if (pkg.scripts?.[script]) pass(`script:${script}`, pkg.scripts[script]);
    else fail(`script:${script}`, 'missing');
  }
} catch (error) {
  fail('runtime', error instanceof Error ? error.message : String(error));
}

if (process.env.RTPU_DEPLOY_ENV && process.env.RTPU_DEPLOY_ENV !== 'production') {
  warn('RTPU_DEPLOY_ENV', `expected production, received ${process.env.RTPU_DEPLOY_ENV}`);
}

console.log('------------------------------------------------');
if (process.exitCode) console.error('PREFLIGHT RESULT: BLOCKED');
else console.log('PREFLIGHT RESULT: READY');
