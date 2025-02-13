#!/usr/bin/env node
// Remove any --inspect flags that might be getting added
process.execArgv = process.execArgv.filter(arg => !arg.includes('--inspect'));

import { Command } from 'commander';
import { generateRules } from './index';
import { loadConfig } from './config';
import { AirulConfig } from './types';
import { initProject } from './init';
import { createNewProject } from './new';
import { execSync, spawn } from 'child_process';
import { getEditorOptions } from './utils';
import { Config } from 'cosmiconfig';
import { generateDrafts, approveDrafts } from './drafts';
import path from 'path';
import { glob } from 'glob';
import fs from 'fs/promises';

const { version } = require('../package.json');

// Add these utility functions at the top after the imports
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fancyBox = async (title: string, content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const width = 60;
  const symbols = {
    info: '📝',
    success: '✨',
    warning: '⚠️',
    error: '❌'
  };
  
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };

  const symbol = symbols[type];
  const color = colors[type];
  const reset = colors.reset;

  // Top border with title
  console.log('\n' + color + '╭' + '─'.repeat(width - 2) + '╮' + reset);
  if (title) {
    // Center title with symbol, accounting for symbol width
    const symbolAndTitle = `${symbol} ${title} `;
    const padding = Math.floor((width - symbolAndTitle.length - 2) / 2);
    const extraSpace = (width - symbolAndTitle.length - 2) % 2; // Handle odd lengths
    console.log(color + '│' + ' '.repeat(padding) + symbolAndTitle + ' '.repeat(padding + extraSpace) + '│' + reset);
    console.log(color + '├' + '─'.repeat(width - 2) + '┤' + reset);
  }

  // Content with exact padding
  const lines = content.split('\n');
  for (const line of lines) {
    const paddedLine = line.padEnd(width - 4);
    await sleep(50); // Slight delay between lines
    console.log(color + '│ ' + reset + paddedLine + color + ' │' + reset);
  }

  // Bottom border
  console.log(color + '╰' + '─'.repeat(width - 2) + '╯' + reset);
  await sleep(200); // Pause after box
};

const fancyProgress = async (step: string, completed: boolean = false) => {
  const color = '\x1b[35m'; // Purple
  const reset = '\x1b[0m';
  const marker = completed ? '◆' : '○';
  console.log(color + `  ${marker} ${step}` + reset);
};

const animateStatus = async (
  title: string,
  lines: string[],
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  speed: number = 100
) => {
  const color = '\x1b[35m'; // Purple
  const reset = '\x1b[0m';
  
  // Print title first
  console.log('\n' + color + title + reset);
  
  // Animate each line with a diamond marker
  for (let i = 0; i < lines.length; i++) {
    await sleep(speed);
    console.log(color + `  ◆ ${lines[i]}` + reset);
  }
  console.log(); // Extra newline at end
};

async function checkAndSelfUpdate(verbose = false): Promise<boolean> {
  try {
    // Get the latest version from npm
    const latestVersion = execSync('npm show airul version', { encoding: 'utf8' }).trim();
    
    if (latestVersion !== version) {
      if (verbose) {
        console.log('📦 Updating Airul...');
        console.log(`Current version: ${version}`);
        console.log(`Latest version:  ${latestVersion}`);
      }
      // Install the latest version globally
      execSync('npm install -g airul@latest', { stdio: verbose ? 'inherit' : 'ignore' });
      if (verbose) {
        console.log('✨ Successfully updated to latest version');
      }
      return true;
    } else if (verbose) {
      console.log('✨ Airul is already at the latest version');
    }
    return false;
  } catch (error) {
    if (verbose) {
      console.error('Error checking for updates:', error);
    }
    return false;
  }
}

const program = new Command();

// Check for updates after command execution
program.hook('postAction', async () => {
  await checkAndSelfUpdate(false);
});

program
  .name('airul')
  .description('Generate rules from your documentation for Cursor, Windsurf, and other AI-powered IDEs')
  .version(version);

// Default command when no other command is specified
program
  .command('start', { isDefault: true })
  .description('Process ideas and generate drafts')
  .option('-i, --idea <name>', 'Specific idea file to process')
  .option('-f, --force', 'Overwrite existing draft files')
  .action(async (options) => {
    try {
      let createdFiles: string[] = [];
      
      async function undoCreation() {
        await cleanupFiles(process.cwd(), [
          'docs/ideas-draft',
          'docs/rules-draft',
          '.cursor/rules'
        ]);
        createdFiles = [];
      }

      const ideasDir = path.join(process.cwd(), 'docs', 'ideas');
      let ideaFiles: string[] = [];
      
      try {
        ideaFiles = await glob('*', {
          cwd: ideasDir,
          absolute: false,
          nodir: true,
          dot: true
        });
      } catch (error) {
        // Ideas directory might not exist
      }

      if (ideaFiles.length === 0) {
        await fancyBox('Welcome to Airul!', 'No ideas found. To get started:\n\n1. Create a file in docs/ideas/\n2. Write your idea in plain text\n3. Run airul again', 'info');
        return;
      }

      // Show welcome message
      await fancyBox('Welcome to Airul!', 'Your AI-powered development companion\n\nLet\'s turn your ideas into reality...', 'success');
      await sleep(1000);

      // Show menu and get choice
      async function showIdeaMenu(): Promise<number> {
        // Get status for each idea file
        const ideaStatuses = await Promise.all(ideaFiles.map(async (file) => {
          const baseDir = process.cwd();
          const ideaDraftsDir = path.join(baseDir, 'docs', 'ideas-draft');
          const rulesDraftsDir = path.join(baseDir, 'docs', 'rules-draft');
          const mdcRulesDir = path.join(baseDir, '.cursor', 'rules');

          const ideaDrafts = await glob(`*${file.replace(/\.[^.]+$/, '')}*.yaml`, { cwd: ideaDraftsDir });
          const ruleDrafts = await glob(`*${file.replace(/\.[^.]+$/, '')}*.yaml`, { cwd: rulesDraftsDir });
          const mdcRules = await glob(`*${file.replace(/\.[^.]+$/, '')}*.mdc`, { cwd: mdcRulesDir });

          let status = '';
          let nextStep = '';
          if (ideaDrafts.length === 0 && ruleDrafts.length === 0 && mdcRules.length === 0) {
            status = '🆕 New idea';
            nextStep = 'Generate implementation drafts';
          } else if (ideaDrafts.length > 0 && ruleDrafts.length === 0) {
            status = '📝 Has implementation drafts';
            nextStep = 'Convert to MDC rules';
          } else if (ruleDrafts.length > 0) {
            status = '📋 Has rule drafts';
            nextStep = 'Create final MDC rules';
          } else if (mdcRules.length > 0) {
            status = '✨ Ready to use';
            nextStep = 'View status';
          }

          return { file, status, nextStep };
        }));

        // Show menu with status for each idea
        const menuContent = ideaStatuses.map((item, i) => 
          `${i + 1}. ${item.file}\n   ${item.status} - Next: ${item.nextStep}`
        ).join('\n') + '\n\nb. Exit';

        await fancyBox('Your Ideas', menuContent, 'info');
        
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>(resolve => {
          readline.question('\nChoose an idea to work on: ', resolve);
        });
        readline.close();

        if (answer.toLowerCase() === 'b') {
          return -1;
        }
        return parseInt(answer);
      }

      // Main menu loop with progress tracking
      while (true) {
        const ideaChoice = await showIdeaMenu();
        if (ideaChoice === -1) {
          await fancyBox('Goodbye!', 'Thank you for using Airul\nHave a great day!', 'success');
          return;
        }

        if (ideaChoice > 0 && ideaChoice <= ideaFiles.length) {
          // Get current status of the chosen idea
          const baseDir = process.cwd();
          const ideaDraftsDir = path.join(baseDir, 'docs', 'ideas-draft');
          const rulesDraftsDir = path.join(baseDir, 'docs', 'rules-draft');
          const mdcRulesDir = path.join(baseDir, '.cursor', 'rules');

          const ideaFile = ideaFiles[ideaChoice - 1];
          const ideaDrafts = await glob(`*${ideaFile.replace(/\.[^.]+$/, '')}*.yaml`, { cwd: ideaDraftsDir });
          const ruleDrafts = await glob(`*${ideaFile.replace(/\.[^.]+$/, '')}*.yaml`, { cwd: rulesDraftsDir });
          const mdcRules = await glob(`*${ideaFile.replace(/\.[^.]+$/, '')}*.mdc`, { cwd: mdcRulesDir });

          // Determine next step based on current state
          let nextStep = '1';
          if (ideaDrafts.length > 0 || ruleDrafts.length > 0) {
            nextStep = '2';
          }

          // Show progress steps one at a time as they complete
          console.log('\n' + '\x1b[35m' + '     Progress' + '\x1b[0m');
          
          await fancyProgress('Reading idea file');
          // Do reading
          await fancyProgress('Reading idea file', true);
          
          await fancyProgress('Analyzing content');
          // Do analysis
          await fancyProgress('Analyzing content', true);
          
          await fancyProgress('Generating drafts');
          // Do generation
          await fancyProgress('Generating drafts', true);
          
          await fancyProgress('Finalizing output');
          // Do finalization
          await fancyProgress('Finalizing output', true);
          
          console.log();

          if (nextStep === '1') {
            // Generate implementation drafts
            const result = await generateDrafts({
              ideaFile: ideaFiles[ideaChoice - 1],
              force: false,
              baseDir: process.cwd(),
              draftType: 'ideas'
            });

            if (result.draftsGenerated > 0) {
              await fancyBox('Success!', 
                `Created ${result.draftsGenerated} implementation drafts in docs/ideas-draft/\n\n` +
                'Next steps:\n' +
                '1. Review the drafts in docs/ideas-draft/\n' +
                '2. Edit if needed\n' +
                '3. Choose this idea again when ready to create MDC rules',
                'success'
              );
            }
          } else {
            // Convert directly to MDC rules
            const result = await approveDrafts({
              baseDir: process.cwd(),
              sourceType: 'ideas'
            });

            if (result.rulesGenerated > 0) {
              await fancyBox('Success!',
                `Generated ${result.rulesGenerated} MDC rules in .cursor/rules/\n\n` +
                'Your AI context has been updated and is ready to use in Cursor!',
                'success'
              );
              return;
            }
          }
        } else {
          await fancyBox('Error',
            'Invalid choice. Please try again.',
            'error'
          );
        }
      }
    } catch (error: any) {
      await fancyBox('Error',
        error.message,
        'error'
      );
      process.exit(1);
    }
  });

program
  .command('update')
  .aliases(['upgrade', 'u'])
  .description('Update Airul to the latest version')
  .action(async () => {
    await checkAndSelfUpdate(true);
  });

program
  .command('init')
  .aliases(['i', 'initialize'])
  .description('Initialize Airul in your project with a default configuration. Optionally specify a task to generate AI-specific instructions.')
  .argument('[task]', 'Optional task description that will be used to generate AI-specific instructions in TODO-AI.md')
  .option('--cursor', 'Enable Cursor editor output (default: enabled only when no other editors are specified)')
  .option('--windsurf', 'Enable Windsurf editor output (default: disabled)')
  .option('--copilot', 'Enable GitHub Copilot output (default: disabled)')
  .option('--code', 'Alias for --copilot')
  .option('--cline', 'Enable Cline VSCode extension output (default: disabled)')
  .action(async (task, options) => {
    try {
      const result = await initProject(
        process.cwd(), 
        task, 
        process.env.NODE_ENV === 'test',
        getEditorOptions(options)
      );
      console.log('✨ Airul initialized successfully!');
      console.log('- Created .airul.json with default configuration');
      if (result.gitInitialized) {
        console.log('- Initialized git repository');
      } else if (result.gitExists) {
        console.log('- Using existing git repository');
      }
      if (result.taskCreated) {
        console.log('- Created TODO-AI.md with your task');
      }
      if (result.rulesGenerated) {
        console.log('- Generated initial AI rules');
      }
      
      console.log('\nNext steps:');
      if (result.taskCreated) {
        console.log('1. Open your project in an AI-powered IDE');
        console.log('2. The AI will see your task and help you complete it');
      } else if (!result.rulesGenerated) {
        console.log('1. Add your documentation to README.md or other files');
        console.log('2. Run airul generate to generate rule files');
      } else {
        console.log('1. Add more documentation to your project');
        console.log('2. Run airul generate to update rule files');
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .aliases(['gen', 'g'])
  .description('Generate AI rules by scanning your documentation files. Creates rule files based on your configuration.')
  .option('-c, --config <path>', 'Path to .airul.json config file. Default: .airul.json in current directory')
  .option('-s, --sources <globs...>', 'Source files to process (e.g., "docs/*.md"). Overrides sources in config file')
  .option('--windsurf', 'Enable .windsurfrules output for Windsurf IDE')
  .option('--cursor', 'Enable .cursorrules output for Cursor IDE')
  .option('--copilot', 'Enable GitHub Copilot output')
  .option('--code', 'Alias for --copilot')
  .option('--cline', 'Enable Cline VSCode extension output')
  .option('--custom-output <path>', 'Path for additional custom rules output file')
  .action(async (options) => {
    try {
      // Try to load config first
      let config;
      try {
        config = await loadConfig(options.config);
      } catch (error) {
        // If config doesn't exist, initialize the project first
        console.log('Airul is not initialized. Initializing first...');
        const initResult = await initProject(process.cwd());
        if (initResult.configCreated) {
          console.log('✨ Project initialized successfully');
          config = await loadConfig(options.config);
        } else {
          throw new Error('Failed to initialize project');
        }
      }
      
      const editorOptions = getEditorOptions(options);
      const generateOptions: AirulConfig = {
        ...config,
        ...(options.sources ? { sources: options.sources } : {}),
        output: {
          ...config.output,
          ...Object.fromEntries(
            Object.entries(editorOptions)
              .filter(([_, value]) => value !== undefined)
          ),
          customPath: options.customOutput || config.output.customPath
        }
      };

      // Clean up any existing generated files first
      await cleanupFiles(process.cwd(), [
        '.cursor/rules',
        '.windsurfrules',
        '.github/copilot-instructions.md',
        '.clinerules'
      ].map(path.dirname));

      await generateRules(generateOptions);
      console.log('Successfully generated AI rules');
    } catch (error) {
      console.error('Error generating rules:', error);
      process.exit(1);
    }
  });

program
  .command('new')
  .aliases(['n'])
  .description('Create a new project directory and initialize Airul')
  .argument('<directory>', 'Directory name for the new project')
  .argument('<task>', 'Task description that will be used to generate AI-specific instructions')
  .option('--cursor', 'Enable and open in Cursor (enabled by default only when no other editors are specified)')
  .option('--windsurf', 'Enable and open in Windsurf')
  .option('--copilot', 'Enable and open in GitHub Copilot')
  .option('--code', 'Alias for --copilot')
  .option('--cline', 'Enable and open in VSCode with Cline extension')
  .action(async (directory, task, options) => {
    try {
      // Check if any editor flag is present
      const hasAnyEditorEnabled = options.windsurf === true ||
        options.copilot === true ||
        options.code === true ||
        options.cline === true;

      // Convert presence of flags to boolean true
      const editorOptions = {
        // Enable cursor by default when no other editors are enabled
        // Only enable cursor by default when no editor is enabled
        cursor: options.cursor === undefined 
          ? !hasAnyEditorEnabled
          : true,
        windsurf: options.windsurf === undefined ? undefined : true,
        copilot: (options.copilot === undefined && options.code === undefined) ? undefined : true,
        cline: options.cline === undefined ? undefined : true
      };
      
      await createNewProject(directory, task, editorOptions);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('approve')
  .aliases(['a'])
  .description('Convert draft YAML files to MDC rules. For ideas drafts, this is a two-step process: first converts to rules drafts for review, then to MDC rules.')
  .option('-d, --draft <name>', 'Specific draft file to approve (e.g., "000-chat-interface.yaml")')
  .option('-f, --force', 'Overwrite existing MDC files')
  .option('-t, --type <type>', 'Source type: "ideas" for implementation drafts or "rules" for rule drafts (default: "rules")')
  .action(async (options) => {
    try {
      // Clean up target directories first
      if (options.type === 'ideas') {
        await cleanupFiles(process.cwd(), ['docs/rules-draft']);
      } else {
        await cleanupFiles(process.cwd(), ['.cursor/rules']);
      }

      const result = await approveDrafts({
        draftFile: options.draft,
        force: options.force || false,
        baseDir: process.cwd(),
        sourceType: (options.type || 'rules') as 'ideas' | 'rules'
      });
      
      if (result.rulesGenerated > 0) {
        if (options.type === 'ideas') {
          await fancyBox('Success', 
            `Generated ${result.rulesGenerated} rule drafts in docs/rules-draft/\n\n` +
            'Next steps:\n' +
            '1. Review the generated rules drafts\n' +
            '2. Edit the drafts as needed\n' +
            '3. Run airul approve again to convert to MDC rules',
            'success'
          );
        } else {
          await fancyBox('Success',
            `Generated ${result.rulesGenerated} MDC rules in .cursor/rules/`,
            'success'
          );
        }
      } else {
        const draftDir = options.type === 'ideas' ? 'docs/ideas-draft/' : 'docs/rules-draft/';
        await fancyBox('Warning',
          `No rules were generated. Check your draft files in ${draftDir}`,
          'warning'
        );
      }
    } catch (error: any) {
      await fancyBox('Error',
        error.message,
        'error'
      );
      process.exit(1);
    }
  });

program
  .command('build')
  .aliases(['b'])
  .description('Build rules from your ideas')
  .option('-a, --all', 'Process all idea files together')
  .option('-f, --file <name>', 'Process specific idea file')
  .action(async (options) => {
    try {
      if (!options.all && !options.file) {
        await fancyBox('Welcome to Airul Rule Builder!',
          'Choose how to process your ideas:\n\n' +
          'airul build --all          # Process all idea files together\n' +
          'airul build -f idea.md     # Process single idea file',
          'info'
        );
        return;
      }

      // Clean up target directories first
      await cleanupFiles(process.cwd(), [
        'docs/rules-draft',
        '.cursor/rules'
      ]);

      const result = await approveDrafts({
        draftFile: options.file,
        force: false,
        baseDir: process.cwd(),
        sourceType: 'ideas'
      });
      
      if (result.rulesGenerated > 0) {
        await fancyBox('Success',
          `Successfully generated ${result.rulesGenerated} rules!`,
          'success'
        );
      } else {
        await fancyBox('Warning',
          'No rules were generated. Check your idea files in docs/ideas/',
          'warning'
        );
      }
    } catch (error: any) {
      await fancyBox('Error',
        error.message,
        'error'
      );
      process.exit(1);
    }
  });

program.parse();

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

// Add this utility function after the other utility functions
async function cleanupFiles(baseDir: string, directories: string[]) {
  for (const dir of directories) {
    const fullPath = path.join(baseDir, dir);
    try {
      // Remove all files in directory
      const files = await glob('*', {
        cwd: fullPath,
        absolute: true,
        dot: true
      });
      
      for (const file of files) {
        try {
          await fs.unlink(file);
        } catch (error) {
          // Ignore errors
        }
      }
      
      // Try to remove the directory if empty
      try {
        await fs.rmdir(fullPath);
      } catch (error) {
        // Ignore if directory not empty or doesn't exist
      }
    } catch (error) {
      // Ignore glob errors
    }
  }
}
