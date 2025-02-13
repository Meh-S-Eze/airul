import { GenerateOptions } from './types';
import { loadConfig } from './core/configuration';
import { generateRules as generate } from './generators/rule-generator';

/**
 * Generate rules from documentation files
 */
export async function generateRules(options: GenerateOptions): Promise<boolean> {
  return generate(options);
}

export { loadConfig };

export { initProject } from './core/initialization';
export { createNewProject } from './core/project-creator';
export * from './types';
