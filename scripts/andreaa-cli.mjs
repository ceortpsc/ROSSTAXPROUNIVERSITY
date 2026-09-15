#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0] || 'help';
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const baseUrl = (flag('base-url', process.env.ANDREAA_BASE_URL || 'http://localhost:3000')).replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) {
    console.error(JSON.stringify({ status: response.status, body }, null, 2));
    process.exit(1);
  }
  console.log(typeof body === 'string' ? body : JSON.stringify(body, null, 2));
}

async function main() {
  switch (command) {
    case 'engine':
      return request(`/api/andreaa-channel/engine?tier=${encodeURIComponent(flag('tier', '10'))}`);
    case 'blueprint': {
      const objective = flag('objective', args.slice(1).join(' '));
      if (!objective) throw new Error('blueprint requires --objective "..."');
      return request('/api/andreaa-channel/engine', {
        method: 'POST',
        body: JSON.stringify({ objective, tier: Number(flag('tier', '10')) })
      });
    }
    case 'capabilities':
      return request(`/api/andreaa-channel/capabilities?plan=${encodeURIComponent(flag('plan', 'ultra-lte'))}`);
    case 'lms':
      return request('/api/lms/integrations');
    case 'health':
      return request('/api/health');
    case 'ops':
      return request('/api/ops/overview');
    case 'help':
    default:
      console.log(`Andreaa Channel CLI\n\nCommands:\n  engine [--tier 10]\n  blueprint --objective "Build a client portal" [--tier 10]\n  capabilities [--plan ultra-lte]\n  lms\n  health\n  ops\n\nGlobal:\n  --base-url http://localhost:3000\n\nExamples:\n  npm run andreaa -- engine --tier 10\n  npm run andreaa -- blueprint --objective "Design an LMS enrollment workflow"\n  npm run andreaa -- lms --base-url https://rosstaxprouniversity.onrender.com`);
  }
}

main().catch((error) => {
  console.error(`[andreaa-cli] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
