# Tree-sitter Build Setup

This document explains how to set up the tree-sitter build system for the IFS Cloud parser.

## Prerequisites

To build the tree-sitter grammars, you need:

1. **Node.js and npm** (for tree-sitter CLI)
2. **Rust toolchain** (already configured)
3. **C compiler** (gcc/clang)

## Installation Steps

### 1. Install Node.js

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nodejs npm
```

**macOS:**
```bash
brew install node
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

### 2. Install tree-sitter CLI

```bash
npm install -g tree-sitter-cli@0.20.0
```

### 3. Generate the grammars

```bash
# From the project root
make build-grammars
```

Or manually:
```bash
cd grammars/tree-sitter-plsql-ifs
tree-sitter generate
tree-sitter test  # Run tests
```

## Current Status

The build system is set up with:

- ✅ Workspace configuration (Cargo.toml)
- ✅ Grammar structure (grammar.js)  
- ✅ Build scripts and Makefile
- ✅ Syntax highlighting queries
- ✅ Test corpus
- ✅ Placeholder C files (for development)
- ⚠️ **Needs Node.js to generate real parser**

## Development Workflow

1. **Grammar Development**: Edit `grammar.js`
2. **Generate Parser**: Run `tree-sitter generate`
3. **Test Grammar**: Run `tree-sitter test`  
4. **Build Rust**: Run `cargo build`
5. **Integration Test**: Run `cargo test`

## Files Created

```
grammars/tree-sitter-plsql-ifs/
├── Cargo.toml           # Rust crate config
├── package.json         # Node.js config  
├── grammar.js           # Grammar definition
├── build.rs             # Rust build script
├── src/
│   ├── lib.rs          # Rust bindings
│   ├── parser.c        # Generated parser (placeholder)
│   └── scanner.c       # External scanner (placeholder)
├── queries/
│   ├── highlights.scm  # Syntax highlighting
│   ├── injections.scm  # Language injection
│   └── locals.scm      # Local variables
└── test/
    └── corpus/
        └── basic.txt   # Test cases
```

## Next Steps

Once Node.js is installed:

1. Run `make build-grammars` to generate real parsers
2. Test with `make test-grammars`
3. Build main project with `make build`
4. Run full test suite with `make test`

The grammar will handle IFS-specific features like `@Override`, `$SEARCH/$REPLACE`, and embedded SQL.
