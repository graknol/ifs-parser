// IFS Parser - A fast parser for IFS Cloud source code
//
// This crate provides parsing capabilities for multiple languages used in IFS Cloud:
// - PL/SQL variant (syntactic sugar on top of Oracle PL/SQL)
// - XML-based table definitions (entities)
// - XML-based enumeration definitions
// - SQL variant for database views
// - Marble DSL for OData v4 endpoints (projections)
// - Marble DSL for frontend client layout and behaviour

pub mod index;
pub mod parser;
pub mod static_analysis;
pub mod utils;

pub use index::*;
pub use parser::*;
pub use static_analysis::*;
pub use utils::*;

/// The main result type used throughout the parser
pub type Result<T> = anyhow::Result<T>;

/// Initialize the parser with default configuration
pub fn init() -> Result<()> {
    env_logger::init();
    log::info!("IFS Parser initialized");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init() {
        assert!(init().is_ok());
    }
}
