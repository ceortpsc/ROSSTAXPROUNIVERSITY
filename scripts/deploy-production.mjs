#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const has = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const verifyUrl = value('verify-url', process.env.ANDREAA_PRODUCTION_URL || 'https://rosstaxprouniversity.onrender.com');
const skipBuild = has('skip-build');
const trigger = has('trigger');

function run(command, commandArgs) {
  console.log(`$ ${command} ${commandArgs.join(' ')}`);
  execFileSync(command, commandArgs, { stdio: 'inherit', env: process.env });
}

async function verify() {
  const endpoints = [
    '/api/health',
    '/api/lms',
    '/api/lms/agents',
    '/api/andreaa-channel/engine?tier=10',
    '/api/platform/evidence'
  ];
  for (const endpoint of endpoints) {
    const response = await fetch(`${verifyUrl.replace(/\/$/, '')}${endpoint}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`verification failed ${endpoint}: HTTP ${response.status}`);
    console.log(`PASS ${endpoint} -> ${response.status}`);
  }
}

async function main() {
  if (process.env.RTPU_DEPLOY_ENV !== 'production') {
    throw new Error('RTPU_DEPLOY_ENV must equal production before running production deployment');
  }

  run(process.execPath, ['scripts/production-preflight.mjs']);
  if (!skipBuild) run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);

  if (trigger) {
    const hook = process.env.RENDER_DEPLOY_HOOK_URL;
    if (!hook) throw new Error('--trigger requires RENDER_DEPLOY_HOOK_URL in the environment');
    const response = await fetch(hook, { method: 'POST' });
    if (!response.ok) throw new Error(`Render deploy hook returned HTTP ${response.status}`);
    console.log('PASS Render deploy hook accepted');
    console.log('Deployment is asynchronous. Verify Render reports LIVE before declaring release completion.');
  } else {
    console.log('No deploy hook called. Use Git push/Render auto-deploy or rerun with --trigger after configuring RENDER_DEPLOY_HOOK_URL.');
  }

  if (has('verify-live')) await verify();
}

main().catch((error) => {
  console.error(`DEPLOYMENT BLOCKED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
