import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { generateRules } from './generator';
import { prompts } from './prompts';

interface DraftOptions {
  ideaFile?: string;
  force?: boolean;
  baseDir: string;
  draftType?: 'ideas' | 'rules';
}

interface ApproveOptions {
  draftFile?: string;
  force?: boolean;
  baseDir: string;
  sourceType?: 'ideas' | 'rules';
}

interface DraftResult {
  draftsGenerated: number;
  outputType: 'ideas-draft' | 'rules-draft';
}

interface ApproveResult {
  rulesGenerated: number;
}

async function analyzeIdea(content: string): Promise<{topics: string[], needsExpansion: boolean}> {
  // Check if content is a complex idea (has code blocks or detailed sections)
  const isComplex = content.includes('```') || // Has code blocks
                    content.includes('##') ||   // Has subsections
                    (content.length > 500 && content.includes('#')); // Long with sections
  
  // Content needs expansion if it's NOT complex and either:
  // 1. Very short (< 100 chars)
  // 2. Only contains links
  // 3. No structure (no sections at all)
  const needsExpansion = !isComplex && (
    content.length < 100 || 
    content.includes('http://') || content.includes('https://') ||
    !content.includes('#')
  );
  
  // Split content into sections by headings
  const sections = content.split(/(?=^#[^#])/m);
  
  // If no sections with headings and needs expansion, create structured content
  if (sections.length === 1 && !sections[0].trim().startsWith('#') && needsExpansion) {
    const originalIdea = content.trim();
    
    // Detect project type and technologies
    const techStack = {
      // Frontend frameworks
      react: /\b(react|nextjs|gatsby)\b/i.test(originalIdea),
      vue: /\b(vue|nuxt)\b/i.test(originalIdea),
      angular: /\b(angular|ng)\b/i.test(originalIdea),
      svelte: /\b(svelte|sveltekit)\b/i.test(originalIdea),
      
      // Backend frameworks
      node: /\b(node|express|nestjs)\b/i.test(originalIdea),
      python: /\b(python|django|flask|fastapi)\b/i.test(originalIdea),
      ruby: /\b(ruby|rails)\b/i.test(originalIdea),
      go: /\b(go|golang|gin|echo)\b/i.test(originalIdea),
      
      // Databases
      sql: /\b(sql|postgres|mysql|sqlite)\b/i.test(originalIdea),
      nosql: /\b(mongo|redis|dynamodb)\b/i.test(originalIdea),
      
      // Common features
      auth: /\b(auth|login|user|account)\b/i.test(originalIdea),
      api: /\b(api|rest|graphql)\b/i.test(originalIdea),
      mobile: /\b(mobile|ios|android|react native)\b/i.test(originalIdea),
      desktop: /\b(desktop|electron|tauri)\b/i.test(originalIdea)
    };

    // Determine primary language and framework
    let primaryFrontend = 'react'; // Default to React if no preference
    if (techStack.vue) primaryFrontend = 'vue';
    if (techStack.angular) primaryFrontend = 'angular';
    if (techStack.svelte) primaryFrontend = 'svelte';

    let primaryBackend = 'node'; // Default to Node if no preference
    if (techStack.python) primaryBackend = 'python';
    if (techStack.ruby) primaryBackend = 'ruby';
    if (techStack.go) primaryBackend = 'go';

    // Create expanded content with sections
    const expandedContent = `# Core Features

## Overview
${originalIdea}

## Key Features
${techStack.auth ? '- User authentication and profiles\n' : ''}${techStack.api ? '- RESTful API endpoints\n' : ''}- Core business logic
- Data persistence
- Error handling
${techStack.mobile ? '- Mobile app support\n' : ''}${techStack.desktop ? '- Desktop app support\n' : ''}- Logging and monitoring

# Technical Architecture

## Backend
${getBackendCode(primaryBackend, techStack)}

## Database Schema
${getDatabaseSchema(techStack)}

# Frontend Design

## Main Components
${getFrontendTypes(primaryFrontend, techStack)}

## UI Components
${getUIComponent(primaryFrontend, techStack)}

# Data Management

## Storage
${techStack.sql ? '- SQL database for structured data\n' : ''}${techStack.nosql ? '- NoSQL database for flexible data\n' : ''}- File storage for assets
- Cache layer for performance
- Backup strategy

## Security
- Secure authentication
- Data encryption
- Input validation
- Regular security audits

# Deployment

## Requirements
- Version control
- CI/CD pipeline
- Monitoring
- Backup system

## Environment Variables
- Database credentials
- API keys
- Service endpoints
- Feature flags

# Development

## Setup Steps
1. Clone repository
2. Install dependencies
3. Configure environment
4. Set up database
5. Start development server

## Testing
- Unit tests
- Integration tests
- E2E tests
- Performance testing

# Maintenance

## Regular Tasks
- Dependency updates
- Security patches
- Performance monitoring
- User feedback collection

## Monitoring
- Error tracking
- Usage analytics
- Performance metrics
- Security scanning`;

    return {
      topics: [expandedContent],
      needsExpansion: true
    };
  }
  
  // If no sections with headings, treat the whole content as one topic
  if (sections.length === 1 && !sections[0].trim().startsWith('#')) {
    return {
      topics: [content.trim()],
      needsExpansion
    };
  }
  
  // Process each section
  const topics = sections.map(section => {
    // Extract heading and content
    const [heading, ...rest] = section.split('\n');
    const sectionContent = rest.join('\n').trim();
    
    // Skip empty sections
    if (!sectionContent) {
      return null;
    }
    
    // Look for subsections
    const subsections = sectionContent.split(/(?=^We should|^The .* should|^The .* needs|^We'll use)/m);
    
    // If no subsections, return the whole section
    if (subsections.length === 1) {
      return section.trim();
    }
    
    // Process each subsection
    return subsections.map(sub => {
      // Add the heading to each subsection
      if (sub.trim()) {
        return `${heading}\n\n${sub.trim()}`;
      }
      return null;
    });
  });
  
  // Flatten and filter out nulls
  return {
    topics: topics
      .flat()
      .filter((t): t is string => t !== null && t.trim().length > 0)
      .map(t => t.trim()),
    needsExpansion
  };
}

// Helper functions to generate code examples based on detected stack
function getBackendCode(backend: string, tech: any): string {
  switch (backend) {
    case 'python':
      return tech.api ? getPythonApiExample() : getPythonExample();
    case 'node':
      return tech.api ? getNodeApiExample() : getNodeExample();
    case 'ruby':
      return tech.api ? getRubyApiExample() : getRubyExample();
    case 'go':
      return tech.api ? getGoApiExample() : getGoExample();
    default:
      return '```\n// Backend implementation will go here\n```';
  }
}

function getDatabaseSchema(tech: any): string {
  if (tech.sql) {
    return getSqlSchema(tech);
  } else if (tech.nosql) {
    return getNoSqlSchema(tech);
  }
  return '```\n// Database schema will go here\n```';
}

function getFrontendTypes(frontend: string, tech: any): string {
  switch (frontend) {
    case 'react':
      return getReactTypes(tech);
    case 'vue':
      return getVueTypes(tech);
    case 'angular':
      return getAngularTypes(tech);
    case 'svelte':
      return getSvelteTypes(tech);
    default:
      return '```\n// Frontend types will go here\n```';
  }
}

function getUIComponent(frontend: string, tech: any): string {
  switch (frontend) {
    case 'react':
      return getReactComponent(tech);
    case 'vue':
      return getVueComponent(tech);
    case 'angular':
      return getAngularComponent(tech);
    case 'svelte':
      return getSvelteComponent(tech);
    default:
      return '```\n// UI components will go here\n```';
  }
}

// Backend code examples
function getPythonExample(): string {
  return '```python\n# Python backend implementation will go here\n```';
}

function getPythonApiExample(): string {
  return '```python\n# Python API implementation will go here\n```';
}

function getNodeExample(): string {
  return '```javascript\n// Node.js backend implementation will go here\n```';
}

function getNodeApiExample(): string {
  return '```javascript\n// Node.js API implementation will go here\n```';
}

function getRubyExample(): string {
  return '```ruby\n# Ruby backend implementation will go here\n```';
}

function getRubyApiExample(): string {
  return '```ruby\n# Ruby API implementation will go here\n```';
}

function getGoExample(): string {
  return '```go\n// Go backend implementation will go here\n```';
}

function getGoApiExample(): string {
  return '```go\n// Go API implementation will go here\n```';
}

// Database schema examples
function getSqlSchema(tech: any): string {
  return '```sql\n-- SQL schema will go here\n```';
}

function getNoSqlSchema(tech: any): string {
  return '```javascript\n// NoSQL schema will go here\n```';
}

// Frontend type examples
function getReactTypes(tech: any): string {
  return '```typescript\n// React types will go here\n```';
}

function getVueTypes(tech: any): string {
  return '```typescript\n// Vue types will go here\n```';
}

function getAngularTypes(tech: any): string {
  return '```typescript\n// Angular types will go here\n```';
}

function getSvelteTypes(tech: any): string {
  return '```typescript\n// Svelte types will go here\n```';
}

// UI component examples
function getReactComponent(tech: any): string {
  return '```jsx\n// React component will go here\n```';
}

function getVueComponent(tech: any): string {
  return '```vue\n<!-- Vue component will go here -->\n```';
}

function getAngularComponent(tech: any): string {
  return '```typescript\n// Angular component will go here\n```';
}

function getSvelteComponent(tech: any): string {
  return '```svelte\n<!-- Svelte component will go here -->\n```';
}

async function generateDraftFile(
  topic: string,
  index: number,
  ideaFile: string,
  baseDir: string,
  draftType: 'ideas' | 'rules' = 'rules'
): Promise<string> {
  // Use the correct output directory based on draft type
  const outputType = draftType === 'rules' ? 'rules-draft' : 'ideas-draft';
  const draftDir = path.join(baseDir, 'docs', outputType);
  
  // Extract title and description from the topic
  const lines = topic.split('\n').filter(line => line.trim());
  const mainTitle = lines[0].replace(/^[#*\s]+/, '').trim();
  
  // Find a more specific title based on the content
  let specificTitle = mainTitle;
  const contentStart = lines.slice(1).join('\n').trim();
  
  // Look for key phrases that indicate what this section is about
  if (draftType === 'ideas') {
    // For ideas drafts, use section headers
    if (contentStart.match(/Core Features/i)) {
      specificTitle = 'Core Features';
    } else if (contentStart.match(/Technical Architecture/i)) {
      specificTitle = 'Technical Architecture';
    } else if (contentStart.match(/Frontend Design/i)) {
      specificTitle = 'Frontend Design';
    } else if (contentStart.match(/Data Management/i)) {
      specificTitle = 'Data Management';
    } else if (contentStart.match(/Deployment/i)) {
      specificTitle = 'Deployment';
    } else if (contentStart.match(/Development/i)) {
      specificTitle = 'Development';
    } else if (contentStart.match(/Maintenance/i)) {
      specificTitle = 'Maintenance';
    }
  } else {
    // For rules drafts, use existing logic
    if (contentStart.match(/^Let'?s\s+create/i)) {
      specificTitle = 'Overview and Goals';
    } else if (contentStart.match(/^We should implement/i)) {
      specificTitle = 'Core Components';
    } else if (contentStart.match(/should support commands/i)) {
      specificTitle = 'User Commands';
    } else if (contentStart.match(/needs to handle/i)) {
      specificTitle = 'Integration Features';
    } else if (contentStart.match(/use a database/i)) {
      specificTitle = 'Data Management';
    } else if (contentStart.match(/built using/i)) {
      specificTitle = 'Technical Stack';
    }
  }
  
  // Generate a description based on the content
  let description = 'Implementation details';
  if (draftType === 'ideas') {
    // For ideas drafts, use more detailed descriptions
    if (contentStart.includes('Core Features')) {
      description = 'Core features and functionality';
    } else if (contentStart.includes('Technical Architecture')) {
      description = 'System architecture and components';
    } else if (contentStart.includes('Frontend Design')) {
      description = 'User interface and experience';
    } else if (contentStart.includes('Data Management')) {
      description = 'Data storage and handling';
    } else if (contentStart.includes('Deployment')) {
      description = 'Deployment and runtime requirements';
    } else if (contentStart.includes('Development')) {
      description = 'Development setup and procedures';
    } else if (contentStart.includes('Maintenance')) {
      description = 'Maintenance and monitoring';
    }
  } else {
    // For rules drafts, use existing logic
    if (contentStart.includes('should implement')) {
      description = 'Core implementation requirements';
    } else if (contentStart.includes('should support')) {
      description = 'Supported user interactions';
    } else if (contentStart.includes('needs to handle')) {
      description = 'Required integration features';
    } else if (contentStart.includes('use a database')) {
      description = 'Database specifications';
    } else if (contentStart.includes('built using')) {
      description = 'Technical architecture';
    }
  }
  
  // Extract app name from idea file
  const appName = ideaFile.replace(/\.(md|yaml)$/, '').replace(/[-_]/g, ' ');
  
  // Clean up the content
  const cleanContent = topic
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n');
  
  // Use 100-based numbering
  const fileNumber = ((index + 1) * 100).toString().padStart(3, '0');
  const fileName = `${fileNumber}-${specificTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.yaml`;
  
  const draftContent = {
    title: specificTitle,
    description: `${description} for the ${appName} application`,
    status: 'draft',
    version: 1,
    last_updated: new Date().toISOString().split('T')[0],
    content: cleanContent
  };
  
  const filePath = path.join(draftDir, fileName);
  await fs.writeFile(filePath, stringifyYaml(draftContent));
  
  return fileName;
}

// Import the animation utilities
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const progressBar = async (progress: number, total: number, label: string) => {
  const width = 30;
  const filled = Math.floor(width * (progress / total));
  const empty = width - filled;
  const color = '\x1b[35m'; // Purple
  const reset = '\x1b[0m';
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  console.log(color + `  ${label} [${bar}] ${Math.round((progress / total) * 100)}%` + reset);
  await sleep(50);
};

export async function generateDrafts(options: {
  ideaFile: string;
  force?: boolean;
  baseDir: string;
  draftType: 'ideas' | 'rules';
}): Promise<{ draftsGenerated: number }> {
  // Create all required directories first - these should never be deleted
  const dirs = [
    path.join(options.baseDir, 'docs', 'ideas'),
    path.join(options.baseDir, 'docs', 'ideas-draft'),
    path.join(options.baseDir, 'docs', 'rules-draft'),
    path.join(options.baseDir, '.cursor', 'rules')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  const ideaPath = path.join(options.baseDir, 'docs', 'ideas', options.ideaFile);
  
  // Simple progress bar for reading
  console.log('\nReading idea file...');
  await progressBar(1, 1, 'Reading');

  let content: string;
  try {
    content = await fs.readFile(ideaPath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read idea file: ${error}`);
  }

  // Simple progress bar for analyzing
  console.log('\nAnalyzing content...');
  await progressBar(1, 1, 'Analyzing');

  let draftsGenerated = 0;
  const outputType = options.draftType === 'rules' ? 'rules-draft' : 'ideas-draft';

  const isSimple = content.length < 1000 && !content.includes('```') && !content.includes('##');

  console.log('\nGenerating drafts...');

  if (isSimple) {
    const draftFile = await generateDraftFile(content, 0, options.ideaFile, options.baseDir, options.draftType);
    console.log(`Created: ${draftFile} in docs/${outputType}/`);
    draftsGenerated++;
  } else {
    const {topics, needsExpansion} = await analyzeIdea(content);
    
    if (needsExpansion) {
      for (let i = 0; i < topics.length; i++) {
        const draftFile = await generateDraftFile(topics[i], i, options.ideaFile, options.baseDir, options.draftType);
        console.log(`Created: ${draftFile} in docs/${outputType}/`);
        draftsGenerated++;
        await progressBar(i + 1, topics.length, 'Generating');
      }
    } else {
      for (let i = 0; i < topics.length; i++) {
        const draftFile = await generateDraftFile(topics[i], i, options.ideaFile, options.baseDir, options.draftType);
        console.log(`Created: ${draftFile} in docs/${outputType}/`);
        draftsGenerated++;
        await progressBar(i + 1, topics.length, 'Generating');
      }
    }
  }

  console.log('\nFinalizing...');
  await progressBar(1, 1, 'Saving');

  console.log('\n✅ Complete!');
  console.log(`Generated ${draftsGenerated} drafts in docs/${outputType}/`);
  console.log(`Next step: ${options.draftType === 'ideas' 
    ? 'Run airul approve -t ideas'
    : 'Run airul approve'}\n`);

  return { draftsGenerated };
}

export async function approveDrafts(options: ApproveOptions): Promise<ApproveResult> {
  const sourceType = options.sourceType || 'rules';
  const draftDir = path.join(options.baseDir, 'docs', sourceType === 'ideas' ? 'ideas-draft' : 'rules-draft');
  
  // Ensure all directories exist
  const dirs = [
    path.join(options.baseDir, 'docs', 'ideas'),
    path.join(options.baseDir, 'docs', 'ideas-draft'),
    path.join(options.baseDir, 'docs', 'rules-draft'),
    path.join(options.baseDir, '.cursor', 'rules')
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  console.log('\nProcessing draft files...');
  await progressBar(1, 1, 'Scanning');

  // Find draft files
  let draftFiles: string[] = [];
  if (options.draftFile) {
    const filePath = path.join(draftDir, options.draftFile);
    try {
      await fs.access(filePath);
      draftFiles = [options.draftFile];
      console.log(`Found draft file: ${options.draftFile}`);
    } catch (error) {
      console.log(`File not found: ${filePath}`);
      return { rulesGenerated: 0 };
    }
  } else {
    draftFiles = await glob('*.yaml', {
      cwd: draftDir,
      absolute: false,
      nodir: true,
      dot: true
    });
  }
  
  if (draftFiles.length === 0) {
    console.log(`No draft files found in ${draftDir}/`);
    return { rulesGenerated: 0 };
  }

  console.log(`Found ${draftFiles.length} draft files to process`);
  
  if (sourceType === 'ideas') {
    console.log('\nConverting ideas to rules...');
    
    for (const draftFile of draftFiles) {
      const draftPath = path.join(draftDir, draftFile);
      const draftContent = await fs.readFile(draftPath, 'utf8');
      const draftYaml = parseYaml(draftContent);
      
      console.log(`Processing: ${draftFile}`);

      // Create rules-draft files
      const rulesDir = path.join(options.baseDir, 'docs', 'rules-draft');

      // Generate domain-specific content
      const topics = [
        {
          title: "Core Features",
          description: "Core features and functionality",
          content: draftYaml.content
        }
      ];

      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const fileNumber = ((i + 1) * 100).toString().padStart(3, '0');
        const fileName = `${fileNumber}-${topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.yaml`;
        
        const ruleContent = {
          title: topic.title,
          description: topic.description,
          status: 'draft',
          version: 1,
          last_updated: new Date().toISOString().split('T')[0],
          content: topic.content
        };

        await fs.writeFile(
          path.join(rulesDir, fileName),
          stringifyYaml(ruleContent)
        );

        console.log(`Created: ${fileName}`);
      }
    }
    
    // Update draftFiles to point to the new rules-draft files
    draftFiles = await glob('*.yaml', {
      cwd: path.join(options.baseDir, 'docs', 'rules-draft'),
      absolute: false,
      nodir: true,
      dot: true
    });

    console.log('\nConversion complete');
    console.log(`Created ${draftFiles.length} rule drafts`);
    console.log('Ready for your review');
    
    return { rulesGenerated: draftFiles.length };
  }
  
  console.log('\nGenerating MDC rules...');
  await progressBar(1, 1, 'Converting');

  // Generate MDC rules from rules-draft
  const result = await generateRules({
    sources: draftFiles.map(f => path.join('docs/rules-draft', f)),
    baseDir: options.baseDir,
    output: {
      cursor: true
    }
  });

  if (result) {
    console.log('\nComplete!');
    console.log(`Generated ${draftFiles.length} MDC rules`);
    console.log('Your AI context has been updated\n');
  }
  
  return { rulesGenerated: draftFiles.length };
} 