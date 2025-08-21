// Index module for storing and retrieving parsed information
//
// This module provides SQLite-based indexing for:
// - Symbol definitions and references
// - AST nodes and their relationships
// - File metadata and dependencies
// - Search capabilities

pub mod database;
pub mod search;
pub mod symbols;

pub use database::*;
pub use search::*;
pub use symbols::*;

use crate::parser::{ast::*, Language};
use crate::Result;
use std::path::Path;

/// The main index for storing parsed information
pub struct Index {
    database: Database,
}

impl Index {
    /// Create a new index with the given database path
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let database = Database::new(db_path)?;
        Ok(Self { database })
    }

    /// Create an in-memory index for testing
    pub fn in_memory() -> Result<Self> {
        let database = Database::in_memory()?;
        Ok(Self { database })
    }

    /// Index a parsed AST from a file
    pub fn index_file<P: AsRef<Path>>(&mut self, file_path: P, ast: &AstNode) -> Result<()> {
        let file_path = file_path.as_ref();
        let language = detect_language_from_path(file_path);

        // Store file metadata
        self.database.store_file(file_path, language)?;

        // Index symbols and references
        let mut symbol_indexer = SymbolIndexer::new(&mut self.database);
        symbol_indexer.index_ast(file_path, ast)?;

        Ok(())
    }

    /// Search for symbols by name
    pub fn search_symbols(&self, query: &str) -> Result<Vec<SymbolInfo>> {
        let searcher = SymbolSearcher::new(&self.database);
        searcher.search_by_name(query)
    }

    /// Find all references to a symbol
    pub fn find_references(&self, symbol: &SymbolInfo) -> Result<Vec<SymbolReference>> {
        let searcher = SymbolSearcher::new(&self.database);
        searcher.find_references(symbol)
    }

    /// Find the definition of a symbol at a specific position
    pub fn find_definition(
        &self,
        file_path: &Path,
        line: usize,
        column: usize,
    ) -> Result<Option<SymbolInfo>> {
        let searcher = SymbolSearcher::new(&self.database);
        searcher.find_definition_at_position(file_path, line, column)
    }

    /// Get all symbols in a file
    pub fn get_file_symbols(&self, file_path: &Path) -> Result<Vec<SymbolInfo>> {
        let searcher = SymbolSearcher::new(&self.database);
        searcher.get_symbols_in_file(file_path)
    }

    /// Get file statistics
    pub fn get_statistics(&self) -> Result<IndexStatistics> {
        self.database.get_statistics()
    }

    /// Clear all indexed data
    pub fn clear(&mut self) -> Result<()> {
        self.database.clear_all()
    }
}

/// Detect language from file path
fn detect_language_from_path(path: &Path) -> Language {
    if let Some(extension) = path.extension().and_then(|ext| ext.to_str()) {
        let ext_with_dot = format!(".{}", extension);
        Language::from_extension(&ext_with_dot).unwrap_or(Language::PlSql)
    } else {
        Language::PlSql
    }
}

/// Statistics about the index
#[derive(Debug, Clone)]
pub struct IndexStatistics {
    pub total_files: usize,
    pub total_symbols: usize,
    pub total_references: usize,
    pub symbols_by_language: std::collections::HashMap<Language, usize>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_index_creation() {
        let index = Index::in_memory();
        assert!(index.is_ok());
    }

    #[test]
    fn test_language_detection() {
        assert_eq!(
            detect_language_from_path(Path::new("test.plsql")),
            Language::PlSql
        );
        assert_eq!(
            detect_language_from_path(Path::new("test.entity")),
            Language::Entity
        );
        assert_eq!(
            detect_language_from_path(Path::new("test.projection")),
            Language::MarbleProjection
        );
    }
}
