//! Tree-sitter grammar for IFS Cloud PL/SQL variant
//!
//! This crate provides a tree-sitter parser for the PL/SQL variant used in IFS Cloud,
//! including support for:
//! - IFS annotations (@Override, @Overtake, @UncheckedAccess)
//! - IFS overtake directives ($SEARCH, $REPLACE, $APPEND, $PREPEND)
//! - IFS visibility conventions (trailing underscores)
//! - Embedded SQL statements
//! - Oracle PL/SQL syntax with IFS extensions

use tree_sitter::Language;

extern "C" {
    fn tree_sitter_plsql_ifs() -> Language;
}

/// Returns the tree-sitter language for IFS PL/SQL
pub fn language() -> Language {
    unsafe { tree_sitter_plsql_ifs() }
}

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const NODE_TYPES: &str = include_str!("../node-types.json");

/// The content of the [`highlights.scm`][] file for this grammar.
///
/// [`highlights.scm`]: https://tree-sitter.github.io/tree-sitter/syntax-highlighting#highlights
pub const HIGHLIGHTS_QUERY: &str = include_str!("../queries/highlights.scm");

/// The content of the [`injections.scm`][] file for this grammar.
///
/// [`injections.scm`]: https://tree-sitter.github.io/tree-sitter/syntax-highlighting#language-injection
pub const INJECTIONS_QUERY: &str = include_str!("../queries/injections.scm");

/// The content of the [`locals.scm`][] file for this grammar.
///
/// [`locals.scm`]: https://tree-sitter.github.io/tree-sitter/syntax-highlighting#local-variables
pub const LOCALS_QUERY: &str = include_str!("../queries/locals.scm");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(language())
            .expect("Error loading IFS PL/SQL grammar");
    }
}
