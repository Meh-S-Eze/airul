import { cosmiconfig } from 'cosmiconfig';
import { AirulConfig } from './types';

const MODULE_NAME = 'airul';

const defaultConfig: AirulConfig = {
  sources: [
    'TODO-AI.md',
    'README.md',
    'docs/ideas/*.yaml',
    'docs/draft/*.yaml',
    '.cursor/rules/*.mdc'
  ],
  output: {
    windsurf: true,
    cursor: true
  }
};

export async function loadConfig(configPath?: string): Promise<AirulConfig> {
  const explorer = cosmiconfig(MODULE_NAME);
  
  const result = configPath 
    ? await explorer.load(configPath)
    : await explorer.search();

  if (!result || !result.config) {
    return defaultConfig;
  }

  const config = result.config;
  
  // Merge with defaults, but prioritize config file's sources
  return {
    ...defaultConfig,
    ...config,
    output: {
      ...defaultConfig.output,
      ...(config.output || {})
    },
    template: {
      ...defaultConfig.template,
      ...(config.template || {})
    }
  };
}
