import fs from "node:fs";

const paths = [
  "config/system-registry.json",
  "config/action-registry.json",
  "config/automation-registry.json",
  "config/capability-registry.json",
  "config/integration-registry.json"
];
for (const p of paths) if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);

const systems = JSON.parse(fs.readFileSync(paths[0]));
const actions = JSON.parse(fs.readFileSync(paths[1]));
const automations = JSON.parse(fs.readFileSync(paths[2]));
const capabilities = JSON.parse(fs.readFileSync(paths[3]));
const integrations = JSON.parse(fs.readFileSync(paths[4]));

const systemIds = new Set(systems.systems.map(x=>x.id));
const brainIds = new Set(systems.brains.map(x=>x.id));
const capabilityIds = new Set(capabilities.capabilities.map(x=>x.id));

for (const s of systems.systems) if (!brainIds.has(s.brain)) throw new Error(`Unknown brain ${s.brain} for ${s.id}`);
for (const a of actions.actions) {
  if (!systemIds.has(a.system)) throw new Error(`Unknown action system ${a.system}`);
  if (!capabilityIds.has(a.capability)) throw new Error(`Unknown capability ${a.capability}`);
}
for (const i of integrations.integrations) if (!systemIds.has(i.system)) throw new Error(`Unknown integration system ${i.system}`);
for (const a of automations.automations) if (!systemIds.has(a.owner.replace(/-engine$|^integration$/,"")) && !brainIds.has(a.owner)) { /* owner can be a brain */ }
console.log(`Control plane valid: ${systems.systems.length} systems, ${systems.brains.length} brains, ${actions.actions.length} actions, ${automations.automations.length} automations, ${capabilities.capabilities.length} capabilities, ${integrations.integrations.length} integrations.`);
