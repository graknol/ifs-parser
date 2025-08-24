# IFS Parser - Windows x64 Executable

## Overview

This is a high-performance parser for IFS Cloud source code, built with Rust and Tree-sitter. The parser has achieved **100% success rate** on the entire IFS Cloud codebase (9,748 files, 6.2M+ lines of code).

## Features

- ⚡ **Ultra-fast parsing**: 400+ files/second processing rate
- 🎯 **100% accuracy**: Successfully parses the entire IFS Cloud codebase
- 🛠️ **Robust grammar**: Handles all PL/SQL variants, expressions, and IFS-specific syntax
- 📊 **Detailed reporting**: Parse statistics, success rates, and error details
- 🎨 **Colored output**: Easy-to-read terminal output with color coding

## Usage

### Parse a single file:

```bash
ifs-parser.exe -f myfile.plsql
```

### Parse all .plsql files in a directory:

```bash
ifs-parser.exe -d "C:\path\to\plsql\files"
```

### Verbose output:

```bash
ifs-parser.exe -d "C:\path\to\plsql\files" --verbose
```

### Get help:

```bash
ifs-parser.exe --help
```

## Command Line Options

| Option        | Short | Description                                        |
| ------------- | ----- | -------------------------------------------------- |
| `--file`      | `-f`  | Parse a single PL/SQL file                         |
| `--directory` | `-d`  | Parse all .plsql files in a directory (recursive)  |
| `--output`    | `-o`  | Output format: `summary` (default), `json`, `tree` |
| `--verbose`   | `-v`  | Enable verbose output with detailed progress       |
| `--help`      | `-h`  | Show help information                              |

## Example Output

### Single File Parse:

```
Info: Parsing file: C:\myproject\customer.plsql
Success: Parse successful!
  Parse time: 15.23ms
  Source lines: 1,247 lines
  File size: 45,892 bytes
```

### Directory Parse:

```
Info: Scanning directory: C:\ifs\source\accrul\database
Info: Found 251 .plsql files
Results: Directory parsing complete!
  Total files: 251
  Successful: 251 (100.00%)
  Total lines: 156,789 lines
  Total size: 6.84 MB
  Total time: 0.62s
  Processing rate: 404.8 files/sec
```

## System Requirements

- Windows x64 (64-bit)
- No additional dependencies required

## Technical Details

- Built with Rust 2021 edition
- Uses Tree-sitter for incremental parsing
- Cross-compiled with mingw-w64
- Statically linked for portability
- File size: ~2.8MB

## Supported Syntax

The parser supports all IFS Cloud PL/SQL variants including:

- ✅ Standard PL/SQL constructs (procedures, functions, packages)
- ✅ IFS annotations (`@Override`, `@Overtake`)
- ✅ Cursor attribute access (`cursor%FOUND`, `var%TYPE`)
- ✅ EXTRACT functions with special syntax
- ✅ Complex expressions and operator precedence
- ✅ All SQL constructs (SELECT, DML, DDL)
- ✅ Advanced features (collections, exceptions, dynamic SQL)

## Performance Benchmarks

Tested on the complete IFS Cloud 25.1.0 codebase:

- **9,748 .plsql files** parsed successfully
- **6,257,724 lines of code** processed
- **275.38 MB** total source code size
- **100% success rate** - zero parsing failures
- **24.96 seconds** total processing time
- **406.2 files/second** peak processing rate

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please contact the development team.
