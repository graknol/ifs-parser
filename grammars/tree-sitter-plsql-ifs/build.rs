use std::path::PathBuf;

fn main() {
    let dir: PathBuf = ["src"].iter().collect();

    cc::Build::new()
        .include(&dir) // This includes src/ which contains our tree_sitter/parser.h
        .file(dir.join("parser.c"))
        .file(dir.join("scanner.c"))
        .compile("tree-sitter-plsql-ifs");

    // Inform cargo to rerun if any of these files change
    println!("cargo:rerun-if-changed=src/parser.c");
    println!("cargo:rerun-if-changed=src/scanner.c");
    println!("cargo:rerun-if-changed=src/tree_sitter/parser.h");
    println!("cargo:rerun-if-changed=grammar.js");
}
