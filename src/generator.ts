import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { AirulConfig, GenerateOptions } from './types';
import { dirname } from 'path';
import { Config } from 'cosmiconfig';
import console from 'console';
import { initProject } from './init';
import { prompts } from './prompts';

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

  // Read and format content from each file
  const contents = await Promise.all(
    files.map(async (file) => {
      try {
        const filePath = path.isAbsolute(file) ? file : path.join(baseDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const trimmed = content.trim();
        if (!trimmed) {
          console.warn(prompts.emptyFileWarning(file));
          return '';
        }
        const fileHeader = mergedConfig.template?.fileHeader?.replace('{fileName}', file) || `# From ${file}:`;
        return `${fileHeader}\n\n${trimmed}`;
      } catch (error: any) {
        console.warn(prompts.fileReadError(file, error.message));
        return '';
      }
    })
  );

  // Filter out empty contents
  const validContents = contents.filter(Boolean);

  if (validContents.length === 0) {
    return false;
  }

  // Add intro context and join contents with separator
  const separator = mergedConfig.template?.separator || '\n---\n';
  const intro = prompts.contextIntro(validContents.length) + '\n\n';
  const fullContent = intro + validContents.join(`${separator}\n`);

  // Write output files based on configuration
  const writePromises: Promise<void>[] = [];

  if (mergedConfig.output.windsurf) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.windsurfrules'), fullContent));
  }

  if (mergedConfig.output.cursor) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.cursorrules'), fullContent));
  }

  if (mergedConfig.output.cline) {
    writePromises.push(fs.writeFile(path.join(baseDir, '.clinerules'), fullContent));
  }

  if (mergedConfig.output.copilot) {
    // Create .github directory if it doesn't exist
    const githubDir = path.join(baseDir, '.github');
    await fs.mkdir(githubDir, { recursive: true });
    writePromises.push(fs.writeFile(path.join(githubDir, 'copilot-instructions.md'), fullContent));
  }

  if (mergedConfig.output.customPath) {
    writePromises.push(fs.writeFile(path.join(baseDir, mergedConfig.output.customPath), fullContent));
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
