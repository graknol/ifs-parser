# Tree-sitter PL/SQL IFS - Multi-Language Bindings

This directory contains bindings for multiple programming languages to use the IFS Cloud PL/SQL parser.

## Available Bindings

### Node.js

- **Location**: `bindings/node/`
- **Build**: `npm install` (builds automatically via binding.gyp)
- **Usage**:

```javascript
const parser = require("tree-sitter-plsql-ifs");
// Use with tree-sitter library
```

### Python

- **Location**: `bindings/python/`
- **Build**: `pip install .` (from bindings/python directory)
- **Usage**:

```python
import tree_sitter_plsql_ifs
# Use with py-tree-sitter library
```

### C# (.NET)

- **Location**: `bindings/csharp/`
- **Build**: `dotnet build`
- **Usage**:

```csharp
using TreeSitter.PlSqlIfs;

var parser = PlSqlIfsLanguage.CreateParser();
var tree = parser.ParseString(sourceCode);
```

## Building All Bindings

From the root `grammars/tree-sitter-plsql-ifs/` directory:

```bash
# Build Node.js bindings
cd bindings/node && npm install

# Build Python bindings
cd ../python && pip install .

# Build C# bindings
cd ../csharp && dotnet build
```

## Parser Features

This Tree-sitter grammar achieves **100% success rate** on the entire IFS Cloud codebase (9,748 files), supporting:

- Complete IFS Cloud PL/SQL variant syntax
- IFS-specific annotations and pragmas
- Advanced expression handling with attribute access
- EXTRACT function and built-in functions
- Comprehensive error recovery

## Integration Examples

Each binding provides the same core functionality:

- Parse PL/SQL source code into syntax trees
- Navigate and query AST nodes
- Extract syntax information for analysis
- Support for incremental parsing

See the individual binding directories for language-specific documentation and examples.
