import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { AirulConfig, GenerateOptions } from './types';
import { dirname } from 'path';
import { Config } from 'cosmiconfig';
import console from 'console';
import { initProject } from './init';
import { prompts } from './prompts';
import { parse as parseYaml } from 'yaml';

async function expandAndDeduplicate(sources: string[], baseDir: string): Promise<string[]> {
  const seen = new Set<string>();
  const result: string[] = [];

  console.log('Expanding sources:', sources);
  console.log('Base directory:', baseDir);

  for (const pattern of sources) {
    try {
      console.log('\nProcessing pattern:', pattern);
      
      // First try to find the file directly
      const filePath = path.isAbsolute(pattern) ? pattern : path.join(baseDir, pattern);
      console.log('Trying direct file:', filePath);
      try {
        await fs.access(filePath);
        const normalized = path.normalize(pattern);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
          console.log('Found direct file:', normalized);
        }
      } catch (error) {
        console.log('Direct file not found:', filePath);
        
        // Try glob pattern
        console.log('Trying glob pattern:', pattern, 'in directory:', baseDir);
        try {
          const matches = await glob(pattern, {
            cwd: baseDir,
            absolute: false,
            nodir: true,
            dot: true,
            ignore: ['node_modules/**', 'dist/**']
          });

          console.log('Glob matches:', matches);
          for (const file of matches) {
            const normalized = path.normalize(file);
            if (!seen.has(normalized)) {
              seen.add(normalized);
              result.push(normalized);
              console.log('Added glob match:', normalized);
            }
          }
        } catch (globError) {
          console.log('Glob error:', globError);
        }
      }
    } catch (error) {
      console.warn(prompts.invalidGlobWarning(pattern, error));
    }
  }

  console.log('\nFinal result:', result);
  return result;
}

async function generateMdcRule(file: string, content: string, baseDir: string): Promise<void> {
  // Keep exact filename without removing numeric prefix
  const fileName = path.basename(file, path.extname(file));
  
  const ruleName = `${fileName}.mdc`;
  const ruleDir = path.join(baseDir, '.cursor', 'rules');
  
  // Ensure rules directory exists
  await fs.mkdir(ruleDir, { recursive: true });
  
  // Parse YAML content to extract description and content
  const yamlContent = parseYaml(content) as any;
  const description = yamlContent?.description || 'No description provided';
  const ruleContent = yamlContent?.content || content;

  // Determine appropriate globs based on rule name/content
  let globs: string[] = [];
  
  if (fileName.includes('frontend') || content.toLowerCase().includes('frontend') || content.includes('react') || content.includes('vue')) {
    globs = [
      "src/components/**/*.{tsx,jsx}",  // React components
      "src/pages/**/*.{tsx,jsx}",       // Page components
      "src/hooks/**/*.ts",              // React hooks
      "src/styles/**/*.{css,scss}",     // Styles
      "src/types/**/*.ts"               // Frontend types
    ];
  } else if (fileName.includes('technical-architecture') || content.toLowerCase().includes('backend') || content.includes('api')) {
    globs = [
      "src/api/**/*.ts",                // API routes
      "src/services/**/*.ts",           // Business logic
      "src/middleware/**/*.ts",         // Middleware
      "src/config/**/*.ts",             // Configuration
      "src/types/**/*.ts"               // Backend types
    ];
  } else if (fileName.includes('data-management') || content.toLowerCase().includes('database') || content.includes('schema')) {
    globs = [
      "src/models/**/*.ts",             // Data models
      "src/db/**/*.ts",                 // Database logic
      "prisma/**/*.prisma",             // Prisma schema
      "migrations/**/*.sql",            // SQL migrations
      "src/types/**/*.ts"               // Type definitions
    ];
  } else if (fileName.includes('deployment')) {
    globs = [
      "Dockerfile",                     // Docker config
      "docker-compose*.yml",            // Docker compose
      ".env*",                          // Environment files
      "scripts/deploy/**/*",            // Deploy scripts
      "config/**/*.{json,yaml,yml}"     // Config files
    ];
  } else if (fileName.includes('development')) {
    globs = [
      "package.json",                   // Dependencies
      "tsconfig.json",                  // TypeScript config
      ".env*",                          // Environment files
      "scripts/**/*",                   // Dev scripts
      "tests/**/*.{ts,tsx}"             // Test files
    ];
  } else if (fileName.includes('maintenance')) {
    globs = [
      "scripts/backup/**/*",            // Backup scripts
      "scripts/monitor/**/*",           // Monitoring
      "logs/**/*",                      // Log files
      "config/**/*.{json,yaml,yml}",    // Config files
      ".github/**/*"                    // GitHub workflows
    ];
  } else if (fileName.includes('core-features')) {
    globs = [
      "src/**/*.{ts,tsx}",             // All source files
      "docs/**/*.md",                  // Documentation
      "README.md",                     // Main readme
      "CONTRIBUTING.md",               // Contributing guide
      "CHANGELOG.md"                   // Change log
    ];
  } else {
    // Default globs for unknown rule types
    globs = [
      "src/**/*.{ts,tsx,js,jsx}",      // Source files
      "docs/**/*.md",                  // Documentation
      "**/*.{yaml,yml,json}"           // Config files
    ];
  }
  
  // Create MDC frontmatter
  const mdcContent = `---
name: ${fileName}
description: ${description}
version: "1.0"
globs: ${globs.join(', ')}
triggers: file_change, file_open
---
${ruleContent}`;

  // Write the rule file
  await fs.writeFile(path.join(ruleDir, ruleName), mdcContent);
}

export async function generateRules(options: GenerateOptions): Promise<boolean> {
  const baseDir = options.baseDir || process.cwd();

  // Ensure base directory exists
  await fs.mkdir(baseDir, { recursive: true });

  // Check if project needs initialization
  const configPath = path.join(baseDir, '.airul.json');
  let config: AirulConfig;
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent) as AirulConfig;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Initialize project if config doesn't exist
      const result = await initProject(baseDir);
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent) as AirulConfig;
    } else {
      throw error;
    }
  }

  // Merge provided options with config from file
  const mergedConfig: AirulConfig = {
    ...config,
    sources: options.sources || config.sources,
    output: options.output ? {
      ...config.output,
      ...options.output
    } : config.output,
    template: options.template || config.template || {}
  };

  // Expand glob patterns and deduplicate while preserving order
  const files = await expandAndDeduplicate(mergedConfig.sources, baseDir);

  if (files.length === 0) {
    console.warn(prompts.noSourcesFound);
    return false;
  }

  console.log('All files:', files);
  
  // Separate files by type
  const proposalFiles = files.filter(f => f.startsWith('docs/proposals/') && f.endsWith('.yaml'));
  console.log('Proposal files:', proposalFiles);
  
  const draftFiles = files.filter(f => f.startsWith('docs/draft/') && f.endsWith('.yaml'));
  console.log('Draft files:', draftFiles);
  
  const otherFiles = files.filter(f => !proposalFiles.includes(f) && !draftFiles.includes(f));
  console.log('Other files:', otherFiles);

  // Process YAML files into separate rules
  const writePromises: Promise<void>[] = [];

  // Process proposals directly to rules
  for (const file of proposalFiles) {
    console.log('Processing proposal:', file);
    const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
    console.log('Proposal file path:', filePath);
    const content = await fs.readFile(filePath, 'utf8');
    console.log('Proposal content:', content.substring(0, 100) + '...');
    writePromises.push(generateMdcRule(file, content, baseDir));
  }

  // Process draft files into rules
  for (const file of draftFiles) {
    console.log('Processing draft:', file);
    const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
    console.log('Draft file path:', filePath);
    const content = await fs.readFile(filePath, 'utf8');
    console.log('Draft content:', content.substring(0, 100) + '...');
    writePromises.push(generateMdcRule(file, content, baseDir));
  }

  // Process other files into individual MDC files too
  for (const file of otherFiles) {
    try {
      const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const trimmed = content.trim();
      if (!trimmed) {
        console.warn(prompts.emptyFileWarning(file));
        continue;
      }
      
      // Generate individual MDC file
      writePromises.push(generateMdcRule(file, trimmed, baseDir));
    } catch (error: any) {
      console.warn(prompts.fileReadError(file, error.message));
    }
  }

  await Promise.all(writePromises);
  return writePromises.length > 0;
}

export async function generate(config: Config) {
  try {
    const result = await generateRules({
      sources: config.sources,
      output: config.output,
      baseDir: process.cwd()
    });

    if (result) {
      console.log('Successfully generated AI rules');
    } else {
      console.warn('No rules were generated. Check your .airul.json output configuration.');
    }
  } catch (error) {
    console.error('Error generating rules:', error);
    process.exit(1);
  }
}
