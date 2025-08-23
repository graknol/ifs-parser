use csv::Writer;
use ifs_parser::parser::tree_sitter_simple::IfsPlsqlParser;
use rayon::prelude::*;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Debug, Serialize, Clone)]
struct ParseResult {
    file_path: String,
    module: String,
    file_name: String,
    line_count: usize,
    file_size: u64,
    parse_success: bool,
    error_message: String,
    parse_time_ms: u64,
}

#[derive(Debug, Serialize)]
struct SummaryStats {
    total_files: usize,
    successful_parses: usize,
    failed_parses: usize,
    success_rate: f64,
    total_lines: usize,
    total_size_mb: f64,
    total_parse_time_ms: u64,
    average_parse_time_ms: f64,
    files_per_second: f64,
}

fn find_ifs_plsql_files(base_path: &Path) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let mut plsql_files = Vec::new();

    println!("🔍 Scanning for IFS modules in: {}", base_path.display());

    if !base_path.exists() {
        return Err(format!("Base path does not exist: {}", base_path.display()).into());
    }

    // Look for module directories
    for entry in fs::read_dir(base_path)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            let module_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown");

            // Look for source/<module>/database/*.plsql pattern
            let database_path = path.join("source").join(module_name).join("database");

            if database_path.exists() {
                println!("  📁 Found module: {}", module_name);

                // Recursively find all .plsql files in the database directory
                find_plsql_files_recursive(&database_path, &mut plsql_files)?;
            }
        }
    }

    println!("📊 Total .plsql files found: {}", plsql_files.len());
    Ok(plsql_files)
}

fn find_plsql_files_recursive(
    dir: &Path,
    files: &mut Vec<PathBuf>,
) -> Result<(), Box<dyn std::error::Error>> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            find_plsql_files_recursive(&path, files)?;
        } else if path.extension().and_then(|s| s.to_str()) == Some("plsql") {
            files.push(path);
        }
    }
    Ok(())
}

fn extract_module_from_path(path: &Path) -> String {
    // Extract module name from path like: C:\repos\_ifs\25.1.0\<module>\source\<module>\database\*.plsql
    let path_str = path.to_string_lossy();
    let parts: Vec<&str> = path_str.split(std::path::MAIN_SEPARATOR).collect();

    // Find the pattern: after 25.1.0, the next directory is the module
    for (i, part) in parts.iter().enumerate() {
        if part.contains("25.1.0") && i + 1 < parts.len() {
            return parts[i + 1].to_string();
        }
    }

    "unknown".to_string()
}

fn parse_single_file(file_path: &Path) -> ParseResult {
    let start_time = Instant::now();
    let mut parser = match IfsPlsqlParser::new() {
        Ok(p) => p,
        Err(e) => {
            return ParseResult {
                file_path: file_path.to_string_lossy().to_string(),
                module: extract_module_from_path(file_path),
                file_name: file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                line_count: 0,
                file_size: 0,
                parse_success: false,
                error_message: format!("Failed to create parser: {}", e),
                parse_time_ms: 0,
            };
        }
    };

    let content = match fs::read_to_string(file_path) {
        Ok(c) => c,
        Err(e) => {
            return ParseResult {
                file_path: file_path.to_string_lossy().to_string(),
                module: extract_module_from_path(file_path),
                file_name: file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                line_count: 0,
                file_size: 0,
                parse_success: false,
                error_message: format!("Failed to read file: {}", e),
                parse_time_ms: 0,
            };
        }
    };

    let line_count = content.lines().count();
    let file_size = content.len() as u64;

    let (parse_success, error_message) = match parser.parse(&content) {
        Ok(_) => (true, String::new()),
        Err(e) => (false, format!("{:?}", e)),
    };

    let parse_time = start_time.elapsed();

    ParseResult {
        file_path: file_path.to_string_lossy().to_string(),
        module: extract_module_from_path(file_path),
        file_name: file_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        line_count,
        file_size,
        parse_success,
        error_message,
        parse_time_ms: parse_time.as_millis() as u64,
    }
}

fn write_results_to_csv(
    results: &[ParseResult],
    output_file: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut wtr = Writer::from_path(output_file)?;

    for result in results {
        wtr.serialize(result)?;
    }

    wtr.flush()?;
    println!("📄 Results written to: {}", output_file);
    Ok(())
}

fn write_summary_to_csv(
    summary: &SummaryStats,
    output_file: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let mut wtr = Writer::from_path(output_file)?;
    wtr.serialize(summary)?;
    wtr.flush()?;
    println!("📊 Summary written to: {}", output_file);
    Ok(())
}

fn calculate_summary(results: &[ParseResult]) -> SummaryStats {
    let total_files = results.len();
    let successful_parses = results.iter().filter(|r| r.parse_success).count();
    let failed_parses = total_files - successful_parses;
    let success_rate = if total_files > 0 {
        (successful_parses as f64 / total_files as f64) * 100.0
    } else {
        0.0
    };

    let total_lines: usize = results.iter().map(|r| r.line_count).sum();
    let total_size_mb = results.iter().map(|r| r.file_size as f64).sum::<f64>() / (1024.0 * 1024.0);
    let total_parse_time_ms: u64 = results.iter().map(|r| r.parse_time_ms).sum();
    let average_parse_time_ms = if total_files > 0 {
        total_parse_time_ms as f64 / total_files as f64
    } else {
        0.0
    };
    let files_per_second = if total_parse_time_ms > 0 {
        (total_files as f64) / (total_parse_time_ms as f64 / 1000.0)
    } else {
        0.0
    };

    SummaryStats {
        total_files,
        successful_parses,
        failed_parses,
        success_rate,
        total_lines,
        total_size_mb,
        total_parse_time_ms,
        average_parse_time_ms,
        files_per_second,
    }
}

fn print_progress(processed: usize, total: usize, successful: usize, start_time: Instant) {
    let elapsed = start_time.elapsed();
    let rate = if elapsed.as_secs() > 0 {
        processed as f64 / elapsed.as_secs() as f64
    } else {
        0.0
    };

    let success_rate = if processed > 0 {
        (successful as f64 / processed as f64) * 100.0
    } else {
        0.0
    };

    let eta = if rate > 0.0 && processed < total {
        Duration::from_secs(((total - processed) as f64 / rate) as u64)
    } else {
        Duration::from_secs(0)
    };

    println!(
        "🔄 Progress: {}/{} ({:.1}%) | Success: {:.1}% | Rate: {:.1} files/sec | ETA: {:?}",
        processed,
        total,
        (processed as f64 / total as f64) * 100.0,
        success_rate,
        rate,
        eta
    );
}

#[test]
fn test_full_ifs_codebase_parsing() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Starting full IFS codebase parsing test...");
    let start_time = Instant::now();

    // Adjust this path to match your local IFS installation
    let base_path = Path::new("/mnt/c/repos/_ifs/25.1.0");

    // For testing on Linux, use a fallback path
    let base_path = if !base_path.exists() {
        println!("⚠️  IFS installation path not found, checking for test data...");
        Path::new("./analysis")
    } else {
        base_path
    };

    if !base_path.exists() {
        println!("❌ No IFS codebase found. Please update the path in the test.");
        println!("   Expected: /mnt/c/repos/_ifs/25.1.0 or ./analysis");
        return Ok(());
    }

    // Find all .plsql files
    let files = find_ifs_plsql_files(base_path)?;

    if files.is_empty() {
        println!("⚠️  No .plsql files found!");
        return Ok(());
    }

    println!("📁 Found {} .plsql files to process", files.len());
    println!("🔧 Starting parallel processing...");

    // Create shared progress tracking
    let processed_count = Arc::new(Mutex::new(0usize));
    let success_count = Arc::new(Mutex::new(0usize));
    let total_files = files.len();

    // Process files in parallel using rayon
    let results: Vec<ParseResult> = files
        .par_iter()
        .map(|file_path| {
            let result = parse_single_file(file_path);

            // Update progress (with occasional printing to avoid spam)
            {
                let mut processed = processed_count.lock().unwrap();
                *processed += 1;

                if result.parse_success {
                    let mut success = success_count.lock().unwrap();
                    *success += 1;
                }

                // Print progress every 100 files or at milestones
                if *processed % 100 == 0 || *processed == total_files {
                    let success = *success_count.lock().unwrap();
                    print_progress(*processed, total_files, success, start_time);
                }
            }

            result
        })
        .collect();

    let total_time = start_time.elapsed();

    // Calculate summary statistics
    let summary = calculate_summary(&results);

    // Write detailed results to CSV
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let detailed_output = format!("ifs_parsing_results_{}.csv", timestamp);
    let summary_output = format!("ifs_parsing_summary_{}.csv", timestamp);

    write_results_to_csv(&results, &detailed_output)?;
    write_summary_to_csv(&summary, &summary_output)?;

    // Print final summary
    println!("\n🎉 Full IFS Codebase Parsing Complete!");
    println!("⏱️  Total time: {:?}", total_time);
    println!("📊 Summary Statistics:");
    println!("   📁 Total files: {}", summary.total_files);
    println!(
        "   ✅ Successful: {} ({:.2}%)",
        summary.successful_parses, summary.success_rate
    );
    println!("   ❌ Failed: {}", summary.failed_parses);
    println!("   📝 Total lines: {}", summary.total_lines);
    println!("   💾 Total size: {:.2} MB", summary.total_size_mb);
    println!(
        "   ⚡ Average parse time: {:.2} ms",
        summary.average_parse_time_ms
    );
    println!(
        "   🚀 Processing rate: {:.1} files/sec",
        summary.files_per_second
    );

    // Print module breakdown
    let mut module_stats: std::collections::HashMap<String, (usize, usize)> =
        std::collections::HashMap::new();
    for result in &results {
        let entry = module_stats.entry(result.module.clone()).or_insert((0, 0));
        entry.0 += 1; // total files
        if result.parse_success {
            entry.1 += 1; // successful files
        }
    }

    println!("\n📋 Module Breakdown:");
    let mut module_vec: Vec<_> = module_stats.iter().collect();
    module_vec.sort_by_key(|(module, _)| module.as_str());

    for (module, (total, success)) in module_vec {
        let success_rate = (*success as f64 / *total as f64) * 100.0;
        println!(
            "   {} {} - {}/{} ({:.1}%)",
            if success_rate == 100.0 {
                "✅"
            } else if success_rate >= 95.0 {
                "⚠️ "
            } else {
                "❌"
            },
            module,
            success,
            total,
            success_rate
        );
    }

    // Check if we achieved 100% success
    if summary.success_rate == 100.0 {
        println!(
            "\n🎯 🎉 PERFECT! 100% parsing success achieved across the entire IFS codebase! 🎉 🎯"
        );
    } else {
        println!(
            "\n🔧 {} files need attention to achieve 100% coverage",
            summary.failed_parses
        );
    }

    Ok(())
}
