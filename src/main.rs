use clap::{Arg, ArgMatches, Command};
use colored::*;
use ifs_parser::parser::tree_sitter_simple::IfsPlsqlParser;
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
        Ok(_ast) => {
            let elapsed = start_time.elapsed();

            match matches.get_one::<String>("output").map(|s| s.as_str()) {
                Some("json") => {
                    println!("{}", "JSON output not yet implemented".yellow());
                }
                Some("tree") => {
                    println!("{}", "Tree output not yet implemented".yellow());
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
            println!("{} Parse failed: {}", "Error:".red().bold(), e);
            std::process::exit(1);
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
