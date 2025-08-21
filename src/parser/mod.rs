// Parser module for IFS Cloud source code languages
//
// This module contains parsers for all supported languages:
// - PL/SQL variant
// - XML entities and enumerations
// - SQL variant
// - Marble DSL

pub mod ast;
pub mod lexer;
pub mod parser;

pub use ast::*;
pub use lexer::*;
pub use parser::*;

/// Language types supported by the parser
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Language {
    /// PL/SQL variant with IFS annotations (@Override, @Overtake) and naming conventions
    PlSql,
    /// Entity definitions (XML-based with text representation)
    Entity,
    /// Enumeration definitions (XML-based with text representation)
    Enumeration,
    /// View definitions (custom SQL format with COLUMN definitions)
    Views,
    /// Storage definitions (INDEX, SEQUENCE, TABLE declarations)
    Storage,
    /// Marble DSL for OData v4 projections
    MarbleProjection,
    /// Marble DSL for frontend client layout
    MarbleClient,
}

impl Language {
    /// Get the file extensions associated with this language
    pub fn extensions(&self) -> &'static [&'static str] {
        match self {
            Language::PlSql => &[".plsql"],
            Language::Entity => &[".entity"],
            Language::Enumeration => &[".enumeration"],
            Language::Views => &[".views"],
            Language::Storage => &[".storage"],
            Language::MarbleProjection => &[".projection"],
            Language::MarbleClient => &[".client"],
        }
    }
    
    /// Detect language from file extension
    pub fn from_extension(ext: &str) -> Option<Language> {
        match ext.to_lowercase().as_str() {
            ".plsql" => Some(Language::PlSql),
            ".entity" => Some(Language::Entity),
            ".enumeration" => Some(Language::Enumeration),
            ".views" => Some(Language::Views),
            ".storage" => Some(Language::Storage),
            ".projection" => Some(Language::MarbleProjection),
            ".client" => Some(Language::MarbleClient),
            _ => None,
        }
    }
}
