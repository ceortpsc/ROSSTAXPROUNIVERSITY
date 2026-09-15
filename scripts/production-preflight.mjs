#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'package.json',
  'next.config.mjs',
  'lib/andreaa-engine.ts',
  'lib/andreaa-channel.ts',
  'lib/lms-integration.ts',
  'openapi/andreaa-channel.openapi.yaml',
  'docs/andreaa-channel/PRODUCTION-ENGINEERING-MANUAL.md',
  'docs/andreaa-channel/GOVERNANCE-RBAC.md',
  'docs/andreaa-channel/RUNBOOK.md'
];

const requiredEnv = ['RTPU_DEPLOY_ENV'];
const recommendedEnv = ['RTPU_SUPPORT_EMAIL', 'OPS_ADMIN_KEY', 'GOOGLE_CLASSROOM_CLIENT_ID', 'GOOGLE_CLASSROOM_CLIENT_SECRET', 'GOOGLE_CLASSROOM_REDIRECT_URI'];

function pass(label, details = '') { console.log(`PASS  ${label}${details ? ` - ${details}` : ''}`); }
function warn(label, details = '') { console.log(`WARN  ${label}${details ? ` - ${details}` : ''}`); }
function fail(label, details = '') { console.error(`FAIL  ${label}${details ? ` - ${details}` : ''}`); process.exitCode = 1; }

console.log('Andreaa Channel production preflight');
console.log('------------------------------------');

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
} catch (error) {
  fail('runtime', error instanceof Error ? error.message : String(error));
}

if (process.env.RTPU_DEPLOY_ENV && process.env.RTPU_DEPLOY_ENV !== 'production') {
  warn('RTPU_DEPLOY_ENV', `expected production, received ${process.env.RTPU_DEPLOY_ENV}`);
}

console.log('------------------------------------');
if (process.exitCode) console.error('PREFLIGHT RESULT: BLOCKED');
else console.log('PREFLIGHT RESULT: READY');
