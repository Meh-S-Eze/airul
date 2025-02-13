# Airul

> ⚠️ **REFACTORING IN PROGRESS**: This project is currently undergoing a major refactoring to improve code organization and maintainability. The features listed below were working in the previous version and will be restored after the refactor.

Airul generates context for AI agents from your docs. It gives AI immediate access to up-to-date important info about your project.

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
  
- 🎨 **Editor Support**
  - ✅ Cursor IDE (.cursor/rules/*.mdc) - Fully tested
  - ⚠️ Experimental support for:
    - Windsurf (.windsurfrules)
    - GitHub Copilot (.github/copilot-instructions.md)
    - Cline VSCode extension (.clinerules)

- ⚙️ **Configuration**
  - CLI options for quick setup
  - JSON configuration file
  - NPM scripts integration
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
# 5. Open in Cursor (and other editors if specified)
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

- 🎯 Generate AI context files:
  - Fully tested with Cursor IDE (.cursor/rules/*.mdc)
  - Each YAML file in docs/ideas/ and docs/draft/ becomes its own rule file
  - File generation available for other editors:
    - Windsurf (.windsurfrules) - generates file but format untested
    - GitHub Copilot (.github/copilot-instructions.md) - generates file but format untested
    - Cline VSCode extension (.clinerules) - generates file but format untested
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
3. Generate AI context files in the specified locations
4. Use standard markdown formatting for all outputs

## Configuration

### Sources
- ✅ Support both direct file paths and glob patterns
- ✅ Common patterns work: `docs/**/*.md`, `*.yaml`, etc.
- ✅ Globs are resolved relative to project root
- ✅ Files are processed in order specified
- ✅ Duplicates are automatically removed

### Output Options
- ✅ `cursor`: Cursor IDE rules (.cursor/rules/*.mdc) - Fully tested
- ⚠️ `windsurf`: Windsurf IDE rules (.windsurfrules) - Generates file but format untested
- ⚠️ `copilot`: GitHub Copilot instructions (.github/copilot-instructions.md) - Generates file but format untested
- ⚠️ `cline`: Cline VSCode extension rules (.clinerules) - Generates file but format untested
- ✅ `customPath`: Custom output file path works via CLI

### Note About Editor Support
Currently, only Cursor IDE support has been fully tested. For other editors:
- ✅ Files are generated in standard locations
- ⚠️ All files use the same markdown format as Cursor
- ⚠️ Other editors may require different formatting
- 🔄 Please test with your editor and report any issues!

### Note About Cursor Support
The tool outputs rules to `.cursor/rules/` directory:
- YAML files from docs/ideas/ become 100-*.mdc rules
- YAML files from docs/draft/ become 200-*.mdc rules
- Other documentation is combined into cursor.mdc

This is the recommended format going forward, as the older `.cursorrules` format will be deprecated.

For more information about Cursor's rules system, see:
- [Cursor Rules Documentation](https://docs.cursor.com/context/rules-for-ai#project-rules-recommended)
- [MDC Rules Best Practices](https://forum.cursor.com/t/my-best-practices-for-mdc-rules-and-troubleshooting/50526)

## License

MIT
