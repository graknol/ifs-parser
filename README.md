# IFS Parser

A fast parser for IFS Cloud source code supporting multiple languages:

- **PL/SQL variant** - Oracle PL/SQL with IFS syntactic sugar
- **XML entities** - Table definition language
- **XML enumerations** - Enumeration definition language
- **SQL views** - Database view definitions
- **Marble DSL** - Custom language for OData v4 projections and frontend clients

## Features

- 🚀 **High Performance** - Built in Rust for speed and efficiency
- 🔍 **Symbol Indexing** - Fast symbol lookup and reference finding
- 📊 **Static Analysis** - Code quality, security, and performance checks
- 🛠️ **Language Support** - IntelliSense, auto-completion, and refactoring
- 🔗 **MCP Integration** - Model Context Protocol support for AI assistants

## Quick Start

```bash
# Build the project
cargo build

# Run tests
cargo test

# Run with example file
cargo run -- example.pls
```

## 🎯 Codebase Testing

The IFS Parser includes comprehensive testing capabilities to validate parsing coverage across entire IFS codebases:

### Full IFS Codebase Test

```bash
# Test entire IFS installation (potentially 10K+ files) - COMPREHENSIVE
cargo test test_full_ifs_codebase_parsing -- --nocapture
```

**Features:**

- 🚀 **Parallel Processing** - Utilizes all CPU cores for maximum speed
- 📊 **CSV Reports** - Detailed per-file and summary statistics
- 📈 **Progress Tracking** - Real-time progress with ETA estimates
- 🎯 **Module Analysis** - Success rates broken down by IFS module

See [`FULL_CODEBASE_TEST.md`](FULL_CODEBASE_TEST.md) for complete setup instructions and Windows path configuration.

## Usage

### Parsing a file

```rust
use ifs_parser::{parse_source, Language};

let source = "PACKAGE test_pkg IS END;";
let ast = parse_source(source, Language::PlSql)?;
println!("{:#?}", ast);
```

### Indexing symbols

```rust
use ifs_parser::{Index, parse_source, Language};

let mut index = Index::new("index.db")?;
let ast = parse_source(source, Language::PlSql)?;
index.index_file("test.pls", &ast)?;

// Search for symbols
let symbols = index.search_symbols("test_pkg")?;
```

### Static analysis

```rust
use ifs_parser::{analyze, AnalysisConfig};

let config = AnalysisConfig::default();
let diagnostics = analyze(&ast, &config)?;

for diagnostic in diagnostics {
    println!("{}: {}", diagnostic.severity, diagnostic.message);
}
```

## Architecture

```
src/
├── parser/          # Lexer, parser, and AST definitions
│   ├── ast.rs       # Abstract Syntax Tree nodes
│   ├── lexer.rs     # Tokenizer for all languages
│   └── parser.rs    # Parser implementations
├── static_analysis/ # Rule-based analysis engine
│   ├── rules.rs     # Analysis rule definitions
│   ├── analyzer.rs  # Main analysis engine
│   └── diagnostics.rs # Diagnostic types
├── index/           # SQLite-based symbol indexing
│   ├── database.rs  # Database interface
│   ├── symbols.rs   # Symbol management
│   └── search.rs    # Search capabilities
└── utils/           # Utility functions
    ├── file_utils.rs    # File operations
    ├── performance.rs   # Performance monitoring
    └── logging.rs       # Logging utilities
```

## Supported Languages

### PL/SQL Variant

- Packages, procedures, functions
- Variables, parameters, cursors
- Exception handling
- IFS-specific syntax extensions

### XML Entities

- Table definitions with attributes
- Primary and foreign keys
- Data types and constraints

### XML Enumerations

- Enumeration values with descriptions
- Hierarchical enumerations

### SQL Views

- SELECT statements with JOINs
- Complex WHERE clauses
- Aggregation and grouping

### Marble DSL

- **Projections**: OData v4 endpoint definitions
- **Clients**: Frontend layout and behavior

## Performance

The parser is designed for speed and can handle large codebases:

- ⚡ **Fast parsing**: ~1GB of code in seconds
- 🔍 **Instant search**: SQLite-backed symbol index
- 📈 **Scalable**: Handles enterprise-scale codebases
- 🧵 **Parallel processing**: Multi-threaded analysis

## Development

### Building

```bash
cargo build --release
```

### Testing

```bash
# Run all tests
cargo test

# Run with verbose output
cargo test -- --nocapture

# Run specific test
cargo test test_parse_simple_package
```

### Benchmarking

```bash
cargo bench
```

### Adding New Rules

Create a new rule in `src/static_analysis/rules.rs`:

```rust
fn check_my_rule(ast: &AstNode, config: &HashMap<String, serde_json::Value>) -> Vec<RuleViolation> {
    // Implementation here
}

// Register in RuleRegistry::register_default_rules()
self.register(Rule {
    id: "my-rule".to_string(),
    name: "My Rule".to_string(),
    description: "Description of what this rule checks".to_string(),
    category: RuleCategory::CodeQuality,
    severity: Severity::Warning,
    checker: check_my_rule,
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Run `cargo test` and `cargo clippy`
5. Submit a pull request

## License

This project is licensed under MIT License ([LICENSE-MIT](LICENSE-MIT))
