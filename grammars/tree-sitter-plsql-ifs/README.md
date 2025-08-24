# Tree-sitter PL/SQL IFS

🚀 **High-performance parser for IFS Cloud PL/SQL variant**

**Status**: ✅ **100% success rate** on entire IFS Cloud codebase (9,748 files)

## Quick Start

```bash
# 1. Clone and setup
git clone <repository>
cd ifs-parser/grammars/tree-sitter-plsql-ifs

# 2. Generate grammar
npm run generate

# 3. Run tests
npm test
npm run full-codebase-test

# 4. Package for your language
npm run package python    # Creates Python wheel
npm run package node      # Creates Node.js package
npm run package csharp    # Creates C# package
npm run package all       # Creates all packages
```

That's it! 🎉

## What You Get

### Python Package (`npm run package python`)

```
dist/
├── tree_sitter_plsql_ifs-0.1.0-py3-none-any.whl  # Ready to install
└── python/                                        # Source package
    ├── setup.py                                   # Build config
    ├── pyproject.toml                            # Modern Python config
    ├── binding.cc                                # C++ binding
    ├── src/parser.c                              # Generated parser
    ├── src/tree_sitter/parser.h                  # Headers
    └── README.md                                 # Usage instructions
```

**Install anywhere:**

```bash
pip install tree_sitter_plsql_ifs-0.1.0-py3-none-any.whl
```

**Use immediately:**

```python
import tree_sitter_plsql_ifs
from tree_sitter import Language, Parser

language = Language(tree_sitter_plsql_ifs.language())
parser = Parser()
parser.set_language(language)

tree = parser.parse(b"PROCEDURE Test___ IS BEGIN NULL; END;")
print(tree.root_node.sexp())
```

## Features

- ✅ **100% compatibility** with IFS Cloud codebase
- 🚀 **Ultra-fast** parsing with Tree-sitter
- 📦 **Simple packaging** - one command creates distributable packages
- 🔧 **Auto-dependency handling** - installs required build tools
- 🎯 **Clean output** - flat directory structure, ready to use
- 🔄 **Multiple languages** - Python, Node.js, C# support

## Architecture

The parser supports:

- Complete IFS Cloud PL/SQL variant syntax
- IFS-specific annotations and pragmas
- Advanced expression handling
- EXTRACT function and built-ins
- Comprehensive error recovery

## Development

```bash
# Generate grammar from grammar.js
npm run generate

# Run grammar tests
npm test

# Test against full IFS codebase
npm run full-codebase-test

# Clean build artifacts
npm run clean
```

## Package Structure

Each language package includes:

- **Generated parser** (`src/parser.c`) - The core Tree-sitter parser
- **Headers** (`src/tree_sitter/parser.h`) - Tree-sitter interface
- **Metadata** (`grammar.json`, `node-types.json`) - Grammar definitions
- **Language bindings** - Native interface for target language
- **Build configuration** - Ready-to-build package structure
- **Usage examples** - Complete documentation

## Requirements

- **Node.js** 16+ (for grammar generation and packaging)
- **Python** 3.8+ (for Python packages)
- **C++ compiler** (for building native extensions)

The packaging script automatically installs language-specific build dependencies.

---

**Built for IFS Cloud development** - This parser has been tested and validated on the complete IFS Cloud codebase, ensuring maximum compatibility and reliability.
