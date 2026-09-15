import artifactRegistry from '../config/credential-artifact-registry.json';
import recordsRegistry from '../config/credential-records-registry.json';

export type CredentialArtifact = (typeof artifactRegistry.artifacts)[number];

export function getCredentialRecordsSnapshot() {
  const databaseConfigured = Boolean(process.env.RTPU_RECORDS_DATABASE_URL || process.env.DATABASE_URL);
  const fields = Array.from(new Set(artifactRegistry.artifacts.flatMap((artifact) => artifact.fields))).sort();
  return {
    schemaVersion: '1.0',
    system: 'RTPU Credential & Academic Records',
    persistence: {
      configured: databaseConfigured,
      status: databaseConfigured ? 'connection-configured-schema-application-unverified' : 'schema-ready-not-provisioned',
      migration: recordsRegistry.migration,
      target: recordsRegistry.databaseTarget
    },
    artifacts: {
      templateCount: artifactRegistry.templateCount,
      distinctFieldCount: fields.length,
      categories: Array.from(new Set(artifactRegistry.artifacts.map((artifact) => artifact.category))).sort(),
      registryVersion: artifactRegistry.schemaVersion
    },
    tables: recordsRegistry.tables,
    views: recordsRegistry.views,
    queries: recordsRegistry.queryCatalog,
    governance: recordsRegistry.governance,
    observedAtUtc: new Date().toISOString()
  };
}

export function listCredentialArtifacts() {
  return artifactRegistry.artifacts;
}

export function getCredentialArtifact(artifactId: string) {
  return artifactRegistry.artifacts.find((artifact) => artifact.artifactId === artifactId) ?? null;
}

export function getCredentialFieldRegistry() {
  const usage = new Map<string, string[]>();
  for (const artifact of artifactRegistry.artifacts) {
    for (const field of artifact.fields) {
      const current = usage.get(field) ?? [];
      current.push(artifact.artifactId);
      usage.set(field, current);
    }
  }
  return Array.from(usage.entries())
    .map(([field, usedBy]) => ({ field, token: `{{${field}}}`, usedBy }))
    .sort((a, b) => a.field.localeCompare(b.field));
}

export function getRecordsTableRegistry() {
  return recordsRegistry.tables;
}

export function getRecordsViewRegistry() {
  return recordsRegistry.views;
}

export function getRecordsQueryRegistry() {
  return recordsRegistry.queryCatalog;
}
