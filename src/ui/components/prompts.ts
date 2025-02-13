export const prompts = {
  // Context intro for AI tools
  contextIntro: (sourcesCount: number) => 
    `This is a context for AI editor/agent about the project. It's generated with a tool Airul (https://airul.dev) out of ${sourcesCount} sources. Feel free to edit .airul.json to change the sources and configure editors. Run \`airul gen\` to update the context after making changes to .airul.json or the sources.`,

  // Config descriptions
  configWhat: "Generate AI rules from your documentation for Cursor, Windsurf, GitHub Copilot, and other AI-powered tools",
  configHow: "Edit 'sources' to include your important docs (supports glob patterns like 'docs/*.md') and enable/disable AI tools in 'output'",

  // Tasks
  defaultTask: "Learn from the user about their project, get the idea of what they want to make",
  
  // Simple vs Complex ideas
  simpleIdeaWarning: `
⚠️  Simple Idea Detected
This appears to be a simple idea without much detail or research.

Recommended steps before proceeding:
1. Use ChatGPT or another AI tool to explore and expand your idea
2. Research similar existing solutions
3. Think about specific features and requirements
4. Document your findings in a more detailed idea file

Benefits of detailed ideas:
- Better context for AI tools
- More accurate code generation
- Clearer project structure
- Fewer iterations needed

Options:
1. Continue anyway (not recommended)
2. Hold and do more research (recommended)
`,

  simpleIdeaGoodChoice: `
✨ Good choice! Come back when you have:
1. Researched similar solutions
2. Listed specific features
3. Considered technical requirements
4. Added code examples if possible
`,

  simpleIdeaProceed: '\n⚠️  Proceeding with simple idea (expect basic results)...\n',
  
  // TODO template
  todoTemplate: (task: string, date: string) => `# AI Workspace

## Active Task
${task}

## Status
⏳ In Progress

## Context & Progress
- Created: ${date}
- I (AI) will maintain this document as we work together
- My current focus: Understanding and working on the active task

## Task History
- Initial task: ${task}

## Notes
- I'll update this file to track our progress and maintain context
- I'll keep sections concise but informative
- I'll update status and add key decisions/changes
- I'll add new tasks as they come up`,
  
  // Warning messages
  noSourcesFound: "No sources found",
  emptyFileWarning: (file: string) => `Warning: File ${file} is empty`,
  invalidGlobWarning: (pattern: string, error: any) => `Warning: Invalid glob pattern ${pattern}: ${error}`,
  fileReadError: (file: string, error: string) => `Warning: Could not read file ${file}: ${error}`,
  gitInitSkipped: "Note: Git initialization skipped - git may not be installed",
  rulesGenerationSkipped: "Note: Initial rules generation skipped - add documentation first",
  draftSuccess: (draftsGenerated: number, outputType: 'ideas-draft' | 'rules-draft') => {
    if (outputType === 'ideas-draft') {
      return `✨ Generated ${draftsGenerated} draft files in docs/${outputType}/

Next steps:
1. Review the generated drafts in docs/${outputType}/
2. Edit drafts as needed
3. Run airul approve -t ideas to convert to rules drafts
4. Review and edit the rules drafts
5. Run airul approve again to convert to MDC rules`;
    } else {
      return `✨ Generated ${draftsGenerated} draft files in docs/${outputType}/

Next steps:
1. Review the generated drafts in docs/${outputType}/
2. Edit drafts as needed
3. Run airul approve to convert approved drafts to MDC rules`;
    }
  },

  // Multiple ideas handling
  multipleIdeasFound: (count: number) => `
Found ${count} idea files in your ideas folder.

If these files are RELATED PARTS OF THE SAME IDEA:
- Choose "Process all ideas" to combine them into a single cohesive implementation
- This is good for complex ideas split across multiple files

If these are SEPARATE IDEAS:
- Choose a specific idea file to process it individually
- Process one idea at a time for best results

Note: Processing multiple unrelated ideas together is not recommended as it may create confusing or conflicting implementations.
`,

  processingAllIdeas: '\n✨ Processing all files as parts of the same idea...\n',
  
  processingIdea: (file: string) => `\n✨ Processing single idea file: ${file}...\n`,

  // Add new prompts for multiple files warning
  multipleUnrelatedWarning: `
⚠️  Warning: Make sure all files are related parts of the same idea!
Processing unrelated ideas together may result in:
- Confused implementation details
- Mixed technical requirements
- Conflicting architectural decisions

Are these files parts of the same idea?
1. Yes, process them together
2. No, let me choose one file
`,
}; 