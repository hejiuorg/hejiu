import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { findWorkspaceRoot } from './contracts.js';
import { writeSiteArtifacts } from './manifest.js';

export interface HejiuIntegrationOptions {
  siteKey: string;
}

export function hejiu(options: HejiuIntegrationOptions): AstroIntegration {
  return {
    name: `hejiu-${options.siteKey}`,
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const workspaceRoot = findWorkspaceRoot();
        const summary = await writeSiteArtifacts(workspaceRoot, options.siteKey, fileURLToPath(dir));
        logger.info(
          `Hejiu artifacts: ${summary.publishedPages} published page(s), ${summary.previewPages} preview page(s), ${summary.searchRecords} search record(s)`,
        );
      },
    },
  };
}
