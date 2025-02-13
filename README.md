# Airul

Airul generates context for AI agents from your docs. It gives AI immediate access to up-to-date important info about your project.

## How to use

### Starting a new project

```bash
# Install as a CLI tool
npm install -g airul

# Create a new project and open in Cursor
airul new my-project "Create a React app with authentication" --cursor

# This will:
# 1. Create my-project directory
# 2. Initialize git repository
# 3. Create initial documentation
# 4. Generate AI context files
# 5. Open in Cursor (and other editors if specified)
```

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
    "docs/ideas/*.yaml",
    "docs/draft/*.yaml",
    ".cursor/rules/*.mdc"
  ],
  "output": {
    "cursor": true,     /* outputs to .cursor/rules/cursor.mdc */
    "windsurf": false,  /* generates file but format untested */
    "copilot": false,   /* generates file but format untested */
    "cline": false      /* generates file but format untested */
  }
}
```

Or use CLI options:
```bash
# Specify sources and outputs
airul gen --sources "README.md" "docs/*.yaml" --cursor --custom-output "custom.rules"

# Enable multiple outputs
airul gen --sources "README.md" --windsurf --copilot --cline
```

This will:
1. Scan your documentation files using verified glob patterns
2. Support direct file paths and glob patterns like `docs/**/*.md`
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
- ✅ `cursor`: Cursor IDE rules (.cursor/rules/cursor.mdc) - Fully tested
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
The tool outputs rules to `.cursor/rules/cursor.mdc` to support Cursor's new MDC rules format. This is the recommended format going forward, as the older `.cursorrules` format will be deprecated.

## License

MIT
