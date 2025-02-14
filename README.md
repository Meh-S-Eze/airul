# Airul

> ⚠️ **REFACTORING IN PROGRESS**: This project is currently undergoing a major refactoring to improve code organization and maintainability. Core functionality works but some features are being restored.

Airul generates context for AI agents from your ideas. Simply write your idea, and Airul will create structured rules for Cursor IDE.

## Quick Start

```bash
# Install
npm install -g airul

# Run
airul

# That's it! Airul will guide you through the process
```

## How It Works

```
┌─────────────────────────────────── AIRUL RULE FLOW ────────────────────────────────────┐
│                                                                                         │
│                              ┌─────────────────┐                                        │
│                              │   User's Idea   │                                        │
│                              │   Plain Text    │                                        │
│                              └───────┬─────────┘                                        │
│                                     │                                                   │
│                              ┌──────▼──────┐                                           │
│                              │ Complexity  │                                           │
│                              │   Check     │                                           │
│                              └──────┬──────┘                                           │
│                    ┌─────Simple────┘    └────Complex─────┐                            │
│                    │                                     │                             │
│            ┌───────▼──────┐                    ┌────────▼─────┐                       │
│            │   Expand &   │                    │    Split &    │                       │
│            │   Generate   │                    │    Process    │                       │
│            └───────┬──────┘                    └────────┬─────┘                       │
│                    │                                    │                              │
│            ┌───────▼──────┐                            │                              │
│            │ ideas-draft/ │                            │                              │
│            │   *.yaml     │                            │                              │
│            └───────┬──────┘                            │                              │
│                    └──────────────┐      ┌────────────┘                              │
│                                   │      │                                            │
│                            ┌──────▼──────▼─────┐                                     │
│                            │  rules-draft/      │                                     │
│                            │     *.yaml         │                                     │
│                            └────────┬───────────┘                                     │
│                                    │                                                  │
│                            ┌───────▼───────┐                                         │
│                            │ .cursor/rules │                                         │
│                            └───────┬───────┘                                         │
│                                   │                                                  │
│           RULE HIERARCHY          ▼                                                  │
│     ┌─────────────────────────────────────────────────┐                             │
│     │  000-*.mdc  Core Rules & Cross-References       │                             │
│     │     ↓                                           │                             │
│     │  100-*.mdc  Fundamental Architecture           │                             │
│     │     ↓       (from docs/ideas/*.yaml)           │                             │
│     │  200-*.mdc  Early Phase Implementation         │                             │
│     │     ↓       (from docs/draft/*.yaml)           │                             │
│     │  300-*.mdc  Later Phase Implementation         │                             │
│     └─────────────────────────────────────────────────┘                             │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### The Process is Simple

1. **Write Your Idea**
   - Create a file in docs/ideas/
   - Write your idea in plain text
   - No special formatting needed

2. **Run Airul**
   - Just type `airul`
   - The system analyzes your idea
   - Follows simple or complex path automatically

3. **Review & Use**
   - Check generated drafts
   - Approve when ready
   - Use in Cursor IDE

### Rule Priority System

[Keep the existing rule priority section - it's core to understanding]

### Directory Structure
```
docs/
├── ideas/          # Put your ideas here
├── ideas-draft/    # System expands ideas here
└── rules-draft/    # Rules are drafted here

.cursor/
└── rules/          # Final rules for Cursor
    ├── 000-*.mdc   # Core rules
    ├── 100-*.mdc   # Architecture rules
    ├── 200-*.mdc   # Early phase rules
    └── 300-*.mdc   # Later phase rules
```

## Examples

### Simple Idea
```markdown
# docs/ideas/chat-app.md
Create a chat application with authentication and real-time messaging
```

### Complex Idea
```markdown
# docs/ideas/e-commerce.md
# Core Features
- User authentication
- Product catalog
- Shopping cart
- Order processing

# Technical Stack
- React frontend
- Node.js backend
- PostgreSQL database
```

Both will be automatically processed into appropriate rules.

## Development Status

Currently restoring and refining:
- Core rule generation
- Idea processing
- Draft management
- Rule organization

## License

MIT
