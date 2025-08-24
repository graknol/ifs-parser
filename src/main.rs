use clap::{Arg, ArgMatches, Command};
use colored::*;
use ifs_parser::parser::tree_sitter_simple::IfsPlsqlParser;
use ifs_parser::parser::ast::AstNode;
use ifs_parser::Result;
use std::fs;
use std::path::Path;
use std::time::Instant;

fn main() -> Result<()> {
    ifs_parser::init()?;

    let app = Command::new("ifs-parser")
        .version("0.1.0")
        .author("Sindre van der Linden")
        .about("A fast parser for IFS Cloud source code")
        .arg(
            Arg::new("file")
                .short('f')
                .long("file")
                .value_name("FILE")
                .help("Parse a single PL/SQL file")
                .required_unless_present("directory"),
        )
        .arg(
            Arg::new("directory")
                .short('d')
                .long("directory")
                .value_name("DIR")
                .help("Parse all .plsql files in a directory")
                .required_unless_present("file"),
        )
        .arg(
            Arg::new("output")
                .short('o')
                .long("output")
                .value_name("OUTPUT")
                .help("Output format: json, tree, summary")
                .default_value("summary"),
        )
        .arg(
            Arg::new("verbose")
                .short('v')
                .long("verbose")
                .help("Enable verbose output")
                .action(clap::ArgAction::SetTrue),
        );

    let matches = app.get_matches();

    if let Some(file_path) = matches.get_one::<String>("file") {
        parse_single_file(file_path, &matches)?;
    } else if let Some(dir_path) = matches.get_one::<String>("directory") {
        parse_directory(dir_path, &matches)?;
    }

    Ok(())
}

fn parse_single_file(file_path: &str, matches: &ArgMatches) -> Result<()> {
    let path = Path::new(file_path);

    if !path.exists() {
        eprintln!("{} File not found: {}", "Error:".red().bold(), file_path);
        std::process::exit(1);
    }

    println!(
        "{} Parsing file: {}",
        "Info:".blue().bold(),
        file_path.cyan()
    );

    let start_time = Instant::now();
    let content = fs::read_to_string(path)?;

    let mut parser = IfsPlsqlParser::new()?;

    match parser.parse(&content) {
        Ok(ast) => {
            let elapsed = start_time.elapsed();

            match matches.get_one::<String>("output").map(|s| s.as_str()) {
                Some("json") => {
                    // Create a comprehensive result object
                    let result = serde_json::json!({
                        "success": true,
                        "file_path": file_path,
                        "parse_time_ms": elapsed.as_secs_f64() * 1000.0,
                        "source_info": {
                            "lines": content.lines().count(),
                            "bytes": content.len(),
                            "chars": content.chars().count()
                        },
                        "ast": ast,
                        "timestamp": chrono::Utc::now().to_rfc3339()
                    });
                    println!("{}", serde_json::to_string_pretty(&result)?);
                }
                Some("tree") => {
                    // Output tree structure
                    println!("{} Tree view:", "AST:".blue().bold());
                    print_ast_tree(&ast, 0);
                }
                _ => {
                    println!("{} Parse successful!", "Success:".green().bold());
                    println!(
                        "  {} {:.2}ms",
                        "Parse time:".bold(),
                        elapsed.as_secs_f64() * 1000.0
                    );
                    println!(
                        "  {} {} lines",
                        "Source lines:".bold(),
                        content.lines().count()
                    );
                    println!("  {} {} bytes", "File size:".bold(), content.len());
                }
            }
        }
        Err(e) => {
            match matches.get_one::<String>("output").map(|s| s.as_str()) {
                Some("json") => {
                    let error_result = serde_json::json!({
                        "success": false,
                        "file_path": file_path,
                        "error": format!("{}", e),
                        "source_info": {
                            "lines": content.lines().count(),
                            "bytes": content.len(),
                            "chars": content.chars().count()
                        },
                        "timestamp": chrono::Utc::now().to_rfc3339()
                    });
                    println!("{}", serde_json::to_string_pretty(&error_result)?);
                }
                _ => {
                    println!("{} Parse failed: {}", "Error:".red().bold(), e);
                    std::process::exit(1);
                }
            }
        }
    }

    Ok(())
}

fn parse_directory(dir_path: &str, matches: &ArgMatches) -> Result<()> {
    let path = Path::new(dir_path);

    if !path.exists() || !path.is_dir() {
        eprintln!(
            "{} Directory not found: {}",
            "Error:".red().bold(),
            dir_path
        );
        std::process::exit(1);
    }

    println!(
        "{} Scanning directory: {}",
        "Info:".blue().bold(),
        dir_path.cyan()
    );

    let plsql_files = find_plsql_files(path)?;

    if plsql_files.is_empty() {
        println!(
            "{} No .plsql files found in directory",
            "Warning:".yellow().bold()
        );
        return Ok(());
    }

    println!(
        "{} Found {} .plsql files",
        "Info:".blue().bold(),
        plsql_files.len()
    );

    let start_time = Instant::now();
    let mut successful = 0;
    let mut failed = 0;
    let mut total_lines = 0;
    let mut total_size = 0;

    for (i, file_path) in plsql_files.iter().enumerate() {
        if matches.get_flag("verbose") {
            println!(
                "  [{}/{}] {}",
                i + 1,
                plsql_files.len(),
                file_path.display()
            );
        }

        match fs::read_to_string(file_path) {
            Ok(content) => {
                total_lines += content.lines().count();
                total_size += content.len();

                let mut parser = IfsPlsqlParser::new()?;
                match parser.parse(&content) {
                    Ok(_) => successful += 1,
                    Err(e) => {
                        failed += 1;
                        if matches.get_flag("verbose") {
                            println!("    {} {}", "Error:".red().bold(), e);
                        }
                    }
                }
            }
            Err(e) => {
                failed += 1;
                if matches.get_flag("verbose") {
                    println!("    {} Failed to read file: {}", "Error:".red().bold(), e);
                }
            }
        }
    }

    let elapsed = start_time.elapsed();
    let success_rate = if plsql_files.len() > 0 {
        (successful as f64 / plsql_files.len() as f64) * 100.0
    } else {
        0.0
    };

    match matches.get_one::<String>("output").map(|s| s.as_str()) {
        Some("json") => {
            let result = serde_json::json!({
                "success": true,
                "directory_path": dir_path,
                "summary": {
                    "total_files": plsql_files.len(),
                    "successful_parses": successful,
                    "failed_parses": failed,
                    "success_rate": success_rate
                },
                "metrics": {
                    "total_lines": total_lines,
                    "total_size_bytes": total_size,
                    "total_size_mb": total_size as f64 / (1024.0 * 1024.0),
                    "total_time_seconds": elapsed.as_secs_f64(),
                    "processing_rate_files_per_sec": plsql_files.len() as f64 / elapsed.as_secs_f64()
                },
                "timestamp": chrono::Utc::now().to_rfc3339()
            });
            println!("{}", serde_json::to_string_pretty(&result)?);
        }
        _ => {
            println!(
                "\n{} Directory parsing complete!",
                "Results:".green().bold()
            );
            println!("  {} {}", "Total files:".bold(), plsql_files.len());
            println!(
                "  {} {} ({:.2}%)",
                "Successful:".bold(),
                successful,
                success_rate
            );
            if failed > 0 {
                println!("  {} {}", "Failed:".bold(), failed.to_string().red());
            }
            println!("  {} {} lines", "Total lines:".bold(), total_lines);
            println!(
                "  {} {:.2} MB",
                "Total size:".bold(),
                total_size as f64 / (1024.0 * 1024.0)
            );
            println!("  {} {:.2}s", "Total time:".bold(), elapsed.as_secs_f64());
            println!(
                "  {} {:.1} files/sec",
                "Processing rate:".bold(),
                plsql_files.len() as f64 / elapsed.as_secs_f64()
            );
        }
    }

    Ok(())
}

fn find_plsql_files(dir: &Path) -> Result<Vec<std::path::PathBuf>> {
    let mut files = Vec::new();

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            files.extend(find_plsql_files(&path)?);
        } else if path.extension().and_then(|s| s.to_str()) == Some("plsql") {
            files.push(path);
        }
    }

    Ok(files)
}

fn print_ast_tree(ast: &AstNode, indent: usize) {
    let indent_str = "  ".repeat(indent);
    
    match ast {
        AstNode::PlSql(node) => {
            println!("{}📁 PL/SQL Node", indent_str);
            print_plsql_node(node, indent + 1);
        }
        AstNode::Entity(_) => {
            println!("{}🏗️  Entity Node", indent_str);
            // Add entity-specific printing if needed
        }
        AstNode::Enumeration(_) => {
            println!("{}📋 Enumeration Node", indent_str);
            // Add enumeration-specific printing if needed
        }
        AstNode::Views(_) => {
            println!("{}👁️  Views Node", indent_str);
            // Add views-specific printing if needed
        }
        AstNode::Storage(_) => {
            println!("{}💾 Storage Node", indent_str);
            // Add storage-specific printing if needed
        }
        AstNode::MarbleProjection(_) => {
            println!("{}🎯 Marble Projection Node", indent_str);
            // Add marble projection-specific printing if needed
        }
        AstNode::MarbleClient(_) => {
            println!("{}🖥️  Marble Client Node", indent_str);
            // Add marble client-specific printing if needed
        }
    }
}

fn print_plsql_node(node: &ifs_parser::parser::ast::PlSqlNode, indent: usize) {
    let indent_str = "  ".repeat(indent);
    
    match node {
        ifs_parser::parser::ast::PlSqlNode::Package { name, component, annotations, declarations, .. } => {
            println!("{}📦 Package: {}", indent_str, name.name.cyan());
            if let Some(comp) = component {
                println!("{}  Component: {}", indent_str, comp.yellow());
            }
            if !annotations.is_empty() {
                println!("{}  Annotations: {:?}", indent_str, annotations);
            }
            println!("{}  Declarations: {} items", indent_str, declarations.len());
        }
        ifs_parser::parser::ast::PlSqlNode::Procedure { name, visibility, annotations, parameters, .. } => {
            println!("{}⚙️  Procedure: {} ({:?})", indent_str, name.name.green(), visibility);
            if !annotations.is_empty() {
                println!("{}  Annotations: {:?}", indent_str, annotations);
            }
            println!("{}  Parameters: {} items", indent_str, parameters.len());
        }
        ifs_parser::parser::ast::PlSqlNode::Function { name, visibility, annotations, parameters, return_type, .. } => {
            println!("{}� Function: {} ({:?})", indent_str, name.name.blue(), visibility);
            if !annotations.is_empty() {
                println!("{}  Annotations: {:?}", indent_str, annotations);
            }
            println!("{}  Parameters: {} items", indent_str, parameters.len());
            println!("{}  Return Type: {:?}", indent_str, return_type);
        }
    }
}
