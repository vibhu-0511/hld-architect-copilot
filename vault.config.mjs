// Vault configuration for the indexer.
// Override at runtime with VAULT_PATH env var, e.g.
//   VAULT_PATH="D:\\notes\\system_design" npm run index:vault
//
// This file is Node-only — never import it from browser code.

const DEFAULT_VAULT_ROOT =
  "C:\\Users\\Admin\\Desktop\\obsidian-2026\\2026\\2026\\Notes\\Personal\\system_design";

export const VAULT_ROOT = process.env.VAULT_PATH || DEFAULT_VAULT_ROOT;
