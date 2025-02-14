# Airul

> ⚠️ **REFACTORING IN PROGRESS**: This project is currently undergoing a major refactoring to improve code organization and maintainability. The features listed below were working in the previous version and will be restored after the refactor.

Airul generates context for AI agents from your docs. It gives AI immediate access to up-to-date important info about your project through a structured rule system.

## Rule Generation Workflow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         AIRUL RULE GENERATION FLOW                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐                                                          │
│  │  User Idea  │                                                          │
│  │ Plain Text  │                                                          │
│  └─────────────┘                                                          │
│        │                                                                  │
│        ▼                                                                  │
│  ┌─────────────┐                                                          │
│  │ Complexity  │                                                          │
│  │   Check     │                                                          │
│  └─────────────┘                                                          │
│        │                                                                  │
│        ├─────────────Simple──────────────┐                               │
│        │                                 │                                │
│        ▼                                 ▼                                │
│  ┌─────────────┐                   ┌─────────────┐                       │
│  │   Complex   │                   │   Simple    │                       │
│  │    Path     │                   │    Path     │                       │
│  └─────────────┘                   └─────────────┘                       │
│        │                                 │                                │
│        │                                 ▼                                │
│        │                           ┌─────────────┐                       │
│        │                           │ ideas-draft │                       │
│        │                           │   *.yaml    │                       │
│        │                           └─────────────┘                       │
│        │                                 │                                │
│        │                                 ▼                                │
│        │                           ┌─────────────┐                       │
│        │                           │  Enhanced   │                       │
│        │                           │ Processing  │                       │
│        │                           └─────────────┘                       │
│        │                                 │                                │
│        └─────────Mild Enhancement───────►│                               │
│                                         ▼                                │
│                                   ┌─────────────┐                       │
│                                   │ rules-draft │                       │
│                                   │   *.yaml    │                       │
│                                   └─────────────┘                       │
│                                         │                                │
│                                         ▼                                │
│                               ┌───────────────────┐                     │
│                               │  .cursor/rules/   │                     │
│                               └───────────────────┘                     │
│                                         │                                │
│                                         ▼                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RULE PRIORITY HIERARCHY                       │   │
│  │                                                                  │   │
│  │  ┌─────────────┐                                                │   │
│  │  │  000-Core   │  Base Context & Cross-References               │   │
│  │  └─────────────┘                                                │   │
│  │         │                                                       │   │
│  │         ▼                                                       │   │
│  │  ┌─────────────┐                                                │   │
│  │  │    100-*    │  Fundamental Architecture Rules               │   │
│  │  └─────────────┘                                                │   │
│  │         │                                                       │   │
│  │         ▼                                                       │   │
│  │  ┌─────────────┐                                                │   │
│  │  │    200-*    │  Early Phase Implementation Rules             │   │
│  │  └─────────────┘                                                │   │
│  │         │                                                       │   │
│  │         ▼                                                       │   │
│  │  ┌─────────────┐                                                │   │
│  │  │    300-*    │  Later Phase Implementation Rules             │   │
│  │  └─────────────┘                                                │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Rule Priority System

- **000-Core**: Base context and cross-references used by all other rules
- **100-Series**: Fundamental architecture decisions and system design patterns
- **200-Series**: Early phase implementation details and setup requirements
- **300-Series**: Later phase implementations and advanced features

### Processing Paths

**Simple Ideas**:
1. Expand to ideas-draft/*.yaml
2. Enhanced processing with templates
3. Generate multiple rule-draft/*.yaml
4. Convert to prioritized .cursor/rules/*.mdc

**Complex Ideas**:
1. Split into logical sections
2. Mild enhancement/structuring
3. Direct to rule-draft/*.yaml
4. Convert to prioritized .cursor/rules/*.mdc

## Previously Working Features (To Be Restored)

Core functionality that was working and will be restored after refactoring:

- 🎯 **AI Context Generation**
  - Converting documentation into AI-readable rules
  - Support for multiple documentation formats (markdown, YAML)
  - Automatic rule file generation with proper prefixes
  
- 🔧 **Project Management**
  - Creating new projects with `airul new`
  - Initializing in existing projects with `airul init`
  - Automatic git repository setup
  
- 📝 **Documentation Processing**
  - Reading from multiple source files
  - Support for glob patterns
  - Smart merging of documentation
  - Duplicate removal
  
- 🎨 **Cursor IDE Integration**
  - Full support for Cursor's rule system
  - Hierarchical rule organization (000-Core, 100-Series, etc.)
  - Cross-referencing between rules
  - Automatic context updates

## Development Status

### 🚧 Current Refactoring

We are currently:
- Reorganizing the codebase into a more modular structure
- Improving code maintainability and testability
- Preparing for new feature additions

### 📅 Timeline
- Phase 1 (Current): Code Restructuring
  - Moving files to appropriate modules
  - Updating import/export structure
  - Setting up proper TypeScript configurations
- Phase 2: Feature Restoration
  - Restoring all previously working features
  - Adding tests for core functionality
  - Updating documentation
- Phase 3: New Features & Improvements
  - Enhanced editor support
  - Better error handling
  - More configuration options

### 🤝 Contributing
While we're refactoring, you can help by:
- Testing the previous version
- Reporting issues
- Suggesting improvements
- Reviewing the new structure

## How to use

> ⚠️ **Note**: During refactoring, new installations may not work as expected. If you need a working version, please use the last stable release or wait for the refactoring to complete.

### Starting a new project

```bash
# Install the last stable version as a CLI tool
npm install -g airul@latest

# Or install a specific version
npm install -g airul@1.0.0  # Replace with last stable version

# Create a new project and open in Cursor
airul new my-project "Create a React app with authentication" --cursor

# This will:
# 1. Create my-project directory
# 2. Initialize git repository
# 3. Create initial documentation
# 4. Generate AI context files
# 5. Open in Cursor
```

### Best Practices for Ideas

For best results when creating ideas:

1. Do research first and include detailed information in your idea files
2. Add code examples and implementation details when possible
3. If starting with a simple prompt:
   - Add relevant links and references
   - The tool will try to expand minimal ideas into more detailed drafts
   - These expanded drafts will then be used to generate rules
4. Structure your ideas with clear sections:
   - Core Architecture
   - Critical Components
   - Workflow Implementation
   - Frontend Integration (if applicable)
   - Data Management
   - Deployment
   - References
   - Maintenance

### Adding to existing project

```bash
# Install as a CLI tool
npm install -g airul

# Initialize airul in your project
airul init 

# This will:
# 1. Add airul as dev dependency
# 2. Create .airul.json config
# 3. Create initial documentation
# 4. Generate AI context files
```

### Keeping context updated

After making changes to your project, you have two options to update the AI context:

#### Option 1: NPM Scripts (Recommended)
Add airul to your package.json:
```json
{
  "devDependencies": {
    "airul": "latest"
  },
  "scripts": {
    "rules": "airul gen",
    "prestart": "airul gen",
    "prebuild": "airul gen"
  }
}
```

Then run:
```bash
# Manual update
npm run rules

# Automatic update before npm start/build
npm start
npm run build
```

#### Option 2: CLI Command
If installed globally:
```bash
# Update AI context manually
airul gen
```

Both approaches will update context when you:
- Add/modify documentation
- Install new dependencies
- Change project structure

## Features

- 🎯 Generate AI context files for Cursor IDE:
  - Hierarchical rule system (.cursor/rules/*.mdc)
  - Priority-based organization (000-Core, 100-Series, etc.)
  - Cross-referencing between rules
  - Automatic context updates
- 📝 Works with any text files (markdown, txt, etc.)
- ⚙️ Simple configuration via CLI or config file
- 🌟 Verified glob pattern support for source files
- 🔄 Smart config merging between CLI and config file

## Example

Create `.airul.json`:
```json
{
  "sources": [
    "TODO-AI.md",
    "README.md",
    "docs/ideas/*.yaml",     /* each file becomes 100-*.mdc */
    "docs/draft/*.yaml",     /* each file becomes 200-*.mdc */
    ".cursor/rules/*.mdc"
  ],
  "output": {
    "cursor": true     /* outputs to .cursor/rules/ */
  }
}
```

Or use CLI options:
```bash
# Generate rules from YAML files
airul gen --sources "docs/ideas/*.yaml" --prefix "100" --cursor
airul gen --sources "docs/draft/*.yaml" --prefix "200" --cursor

# Generate rules from other docs
airul gen --sources "README.md" "TODO-AI.md" --cursor
```

This will:
1. Scan your documentation files using verified glob patterns
2. Convert each YAML file into its own rule file with appropriate prefix
3. Generate AI context files in .cursor/rules/
4. Use standard markdown formatting for all outputs

## Configuration

### Sources
- ✅ Support both direct file paths and glob patterns
- ✅ Common patterns work: `docs/**/*.md`, `*.yaml`, etc.
- ✅ Globs are resolved relative to project root
- ✅ Files are processed in order specified
- ✅ Duplicates are automatically removed

### Output Options
- ✅ Outputs to .cursor/rules/ directory
- ✅ Supports hierarchical rule organization
- ✅ Enables cross-referencing between rules
- ✅ Maintains priority-based structure

For more information about Cursor's rules system, see:
- [Cursor Rules Documentation](https://docs.cursor.com/context/rules-for-ai#project-rules-recommended)
- [MDC Rules Best Practices](https://forum.cursor.com/t/my-best-practices-for-mdc-rules-and-troubleshooting/50526)

## License

MIT
