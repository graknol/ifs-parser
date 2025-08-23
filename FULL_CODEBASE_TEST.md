# Full IFS Codebase Parsing Test

This document describes how to run comprehensive parsing tests on the entire IFS Cloud codebase to ensure 100% coverage.

## Overview

The IFS Parser includes a comprehensive test suite for validating parsing coverage across the entire IFS installation (potentially 10K+ files, millions of lines).

## Full IFS Codebase Test

### Prerequisites

1. **IFS Installation**: Ensure you have access to the full IFS codebase at:

   ```
   C:\repos\_ifs\25.1.0\<module>\source\<module>\database\*.plsql
   ```

2. **Update Path**: Modify the path in `tests/full_codebase_test.rs` if your IFS installation is located elsewhere:
   ```rust
   let base_path = Path::new(r"C:\repos\_ifs\25.1.0");
   ```

### Running the Full Test

```bash
# Run the comprehensive IFS codebase test
cargo test test_full_ifs_codebase_parsing -- --nocapture

# This will:
# - Scan all modules in /mnt/c/repos/_ifs/25.1.0/ (or your configured path)
# - Find all *.plsql files in source/<module>/database/ directories
# - Process files in parallel using all CPU cores
# - Generate detailed CSV reports
```

### Expected Directory Structure

The test expects this IFS directory structure:

```
/mnt/c/repos/_ifs/25.1.0/    (or C:\repos\_ifs\25.1.0\ on Windows)
├── accrul\
│   └── source\accrul\database\*.plsql
├── appsrv\
│   └── source\appsrv\database\*.plsql
├── enterp\
│   └── source\enterp\database\*.plsql
├── fndcab\
│   └── source\fndcab\database\*.plsql
├── prjrep\
│   └── source\prjrep\database\*.plsql
└── [many more modules...]
```

## Test Features

### 🚀 **Parallel Processing**

- Uses Rayon for CPU-parallel file processing
- Processes multiple files simultaneously
- Optimal performance on multi-core systems

### 📊 **Comprehensive Reporting**

- **Detailed CSV**: Per-file results with parsing time, line count, file size
- **Summary CSV**: Overall statistics and success rates
- **Module Breakdown**: Success rates per IFS module
- **Progress Tracking**: Real-time progress with ETA estimates

### 🔍 **Detailed Metrics**

- Total files processed
- Success/failure counts and percentages
- Total lines of code analyzed
- File sizes and processing rates
- Average parse times
- Module-specific statistics

## Sample Output

```
🚀 Starting full IFS codebase parsing test...
🔍 Scanning for IFS modules in: /mnt/c/repos/_ifs/25.1.0
  📁 Found module: accrul
  📁 Found module: appsrv
  📁 Found module: enterp
  [... more modules ...]
📊 Total .plsql files found: 9,748
🔧 Starting parallel processing...
🔄 Progress: 1000/9748 (10.3%) | Success: 100.0% | Rate: 52.6 files/sec | ETA: 166s
🔄 Progress: 2000/9748 (20.5%) | Success: 100.0% | Rate: 100.0 files/sec | ETA: 77s
[... progress updates ...]

🎉 Full IFS Codebase Parsing Complete!
⏱️  Total time: 26.36s
📊 Summary Statistics:
   📁 Total files: 9,748
   ✅ Successful: 9,748 (100.00%)
   ❌ Failed: 0
   📝 Total lines: 6,257,724
   💾 Total size: 275.38 MB
   ⚡ Average parse time: 25.70 ms
   🚀 Processing rate: 374.9 files/sec

📋 Module Breakdown:
   ✅ accrul - 251/251 (100.0%)
   ✅ appsrv - 70/70 (100.0%)
   ✅ enterp - 152/152 (100.0%)
   ✅ fndbas - 551/551 (100.0%)
   [... more modules ...]

📄 Results written to: ifs_parsing_results_20250823_211312.csv
📊 Summary written to: ifs_parsing_summary_20250823_211312.csv
```

## CSV File Formats

### Detailed Results (`ifs_parsing_results_TIMESTAMP.csv`)

| Column        | Description                           |
| ------------- | ------------------------------------- |
| file_path     | Full path to the .plsql file          |
| module        | IFS module name (extracted from path) |
| file_name     | Just the filename                     |
| line_count    | Number of lines in the file           |
| file_size     | File size in bytes                    |
| parse_success | true/false parsing result             |
| error_message | Details if parsing failed             |
| parse_time_ms | Parsing time in milliseconds          |

### Summary Statistics (`ifs_parsing_summary_TIMESTAMP.csv`)

| Column                | Description                         |
| --------------------- | ----------------------------------- |
| total_files           | Total number of files processed     |
| successful_parses     | Number of files parsed successfully |
| failed_parses         | Number of files that failed parsing |
| success_rate          | Percentage of successful parses     |
| total_lines           | Total lines of code processed       |
| total_size_mb         | Total file size in MB               |
| total_parse_time_ms   | Total processing time               |
| average_parse_time_ms | Average time per file               |
| files_per_second      | Processing throughput               |

## Using the Results

### Analysis Suggestions

1. **Identify Problem Modules**: Filter CSV by success_rate < 100%
2. **Performance Analysis**: Sort by parse_time_ms to find slow files
3. **Coverage Tracking**: Monitor success_rate improvements over time
4. **Error Patterns**: Group error_message values to identify common parsing issues

### Excel/Analysis Examples

```sql
-- Find modules with less than 100% success
SELECT module,
       COUNT(*) as total_files,
       SUM(CASE WHEN parse_success THEN 1 ELSE 0 END) as successful,
       (SUM(CASE WHEN parse_success THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
FROM parsing_results
GROUP BY module
HAVING success_rate < 100.0
ORDER BY success_rate ASC;

-- Find slowest files to parse
SELECT file_path, line_count, parse_time_ms,
       (parse_time_ms * 1.0 / line_count) as ms_per_line
FROM parsing_results
WHERE parse_success = true
ORDER BY parse_time_ms DESC
LIMIT 10;
```

## Troubleshooting

### Path Issues

- Ensure the base path exists and is accessible
- Check file permissions for reading .plsql files
- Verify the expected directory structure

### Memory Issues

- Large codebases may require significant RAM
- Monitor system resources during execution
- Consider processing in smaller batches if needed

### Performance Optimization

- The test uses all available CPU cores by default
- Processing rate depends on file sizes and system performance
- SSD storage will significantly improve I/O performance

## Goal: 100% Coverage

The ultimate goal is to achieve **100% parsing success** across the entire IFS Cloud codebase. Use these tests to:

1. **Track Progress**: Monitor success rates as grammar improvements are made
2. **Identify Issues**: Find specific files or patterns that need attention
3. **Validate Fixes**: Ensure grammar changes don't break existing functionality
4. **Demonstrate Quality**: Prove comprehensive parser coverage for production use

🎯 **Target**: 100% success across all IFS modules and thousands of .plsql files!
