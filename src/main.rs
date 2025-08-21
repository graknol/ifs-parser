use ifs_parser::Result;

fn main() -> Result<()> {
    ifs_parser::init()?;

    println!("IFS Parser - A fast parser for IFS Cloud source code");
    println!("Supported languages:");
    println!("  - PL/SQL variant (with IFS syntactic sugar)");
    println!("  - XML entities (table definitions)");
    println!("  - XML enumerations");
    println!("  - SQL variant for database views");
    println!("  - Marble DSL for OData v4 projections");
    println!("  - Marble DSL for frontend client definitions");

    // TODO: Add CLI interface for parsing files
    println!("\nCLI interface coming soon...");

    Ok(())
}
