// Search functionality for the index

use crate::index::database::Database;
use crate::index::symbols::{SymbolInfo, SymbolReference, ReferenceKind};
use crate::Result;
use std::path::Path;

/// Search interface for finding symbols and references
pub struct SymbolSearcher<'a> {
    database: &'a Database,
}

impl<'a> SymbolSearcher<'a> {
    /// Create a new symbol searcher
    pub fn new(database: &'a Database) -> Self {
        Self { database }
    }
    
    /// Search for symbols by name pattern
    pub fn search_by_name(&self, pattern: &str) -> Result<Vec<SymbolInfo>> {
        let rows = self.database.search_symbols(pattern)?;
        Ok(rows.into_iter().map(SymbolInfo::from).collect())
    }
    
    /// Find all references to a symbol
    pub fn find_references(&self, symbol: &SymbolInfo) -> Result<Vec<SymbolReference>> {
        if let Some(symbol_id) = symbol.id {
            let rows = self.database.find_references(symbol_id)?;
            let mut references = Vec::new();
            
            for row in rows {
                let reference = SymbolReference {
                    symbol: symbol.clone(),
                    span: crate::parser::ast::Span {
                        start: crate::parser::ast::Position {
                            line: row.start_line,
                            column: row.start_column,
                            offset: row.start_offset,
                        },
                        end: crate::parser::ast::Position {
                            line: row.end_line,
                            column: row.end_column,
                            offset: row.end_offset,
                        },
                    },
                    file_path: row.file_path,
                    reference_kind: row.reference_kind.parse().unwrap_or(ReferenceKind::Usage),
                };
                references.push(reference);
            }
            
            Ok(references)
        } else {
            Ok(Vec::new())
        }
    }
    
    /// Find symbol definition at a specific position
    pub fn find_definition_at_position(
        &self,
        file_path: &Path,
        line: usize,
        column: usize,
    ) -> Result<Option<SymbolInfo>> {
        let symbols = self.get_symbols_in_file(file_path)?;
        
        // Find the symbol that contains the given position
        for symbol in symbols {
            if symbol.span.start.line <= line
                && line <= symbol.span.end.line
                && symbol.span.start.column <= column
                && column <= symbol.span.end.column
            {
                return Ok(Some(symbol));
            }
        }
        
        Ok(None)
    }
    
    /// Get all symbols in a file
    pub fn get_symbols_in_file(&self, file_path: &Path) -> Result<Vec<SymbolInfo>> {
        let rows = self.database.get_file_symbols(file_path)?;
        Ok(rows.into_iter().map(SymbolInfo::from).collect())
    }
    
    /// Search for symbols by kind
    pub fn search_by_kind(&self, kind_pattern: &str) -> Result<Vec<SymbolInfo>> {
        // This would need to be implemented in the database layer
        // For now, search by name and filter
        let all_symbols = self.search_by_name("*")?;
        Ok(all_symbols
            .into_iter()
            .filter(|s| s.kind.to_string().contains(kind_pattern))
            .collect())
    }
    
    /// Find symbols that reference a given symbol
    pub fn find_incoming_references(&self, symbol: &SymbolInfo) -> Result<Vec<SymbolInfo>> {
        let references = self.find_references(symbol)?;
        let mut referencing_symbols = Vec::new();
        
        for reference in references {
            if let Some(referencing_symbol) = self.find_definition_at_position(
                Path::new(&reference.file_path),
                reference.span.start.line,
                reference.span.start.column,
            )? {
                referencing_symbols.push(referencing_symbol);
            }
        }
        
        Ok(referencing_symbols)
    }
    
    /// Find symbols that are referenced by a given symbol
    pub fn find_outgoing_references(&self, _symbol: &SymbolInfo) -> Result<Vec<SymbolInfo>> {
        // This would require analyzing the symbol's body/implementation
        // For now, return empty vector as this is complex to implement
        Ok(Vec::new())
    }
    
    /// Search for unused symbols (symbols with no references)
    pub fn find_unused_symbols(&self) -> Result<Vec<SymbolInfo>> {
        // This would require a more complex query joining symbols and references
        // For now, return empty vector
        Ok(Vec::new())
    }
}

/// Advanced search queries
pub struct SearchQuery {
    pub name_pattern: Option<String>,
    pub kind_filter: Option<Vec<String>>,
    pub file_pattern: Option<String>,
    pub limit: Option<usize>,
    pub include_documentation: bool,
}

impl Default for SearchQuery {
    fn default() -> Self {
        Self {
            name_pattern: None,
            kind_filter: None,
            file_pattern: None,
            limit: Some(100),
            include_documentation: false,
        }
    }
}

impl SearchQuery {
    /// Create a new search query
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Set name pattern for the search
    pub fn with_name(mut self, pattern: String) -> Self {
        self.name_pattern = Some(pattern);
        self
    }
    
    /// Set kind filter for the search
    pub fn with_kinds(mut self, kinds: Vec<String>) -> Self {
        self.kind_filter = Some(kinds);
        self
    }
    
    /// Set file pattern for the search
    pub fn with_file_pattern(mut self, pattern: String) -> Self {
        self.file_pattern = Some(pattern);
        self
    }
    
    /// Set limit for search results
    pub fn with_limit(mut self, limit: usize) -> Self {
        self.limit = Some(limit);
        self
    }
    
    /// Include documentation in search results
    pub fn include_docs(mut self) -> Self {
        self.include_documentation = true;
        self
    }
}

/// Search result with additional metadata
#[derive(Debug, Clone)]
pub struct SearchResult {
    pub symbol: SymbolInfo,
    pub score: f64,
    pub context: Option<String>,
}

/// Advanced searcher with ranking and filtering
pub struct AdvancedSearcher<'a> {
    database: &'a Database,
}

impl<'a> AdvancedSearcher<'a> {
    /// Create a new advanced searcher
    pub fn new(database: &'a Database) -> Self {
        Self { database }
    }
    
    /// Execute a search query
    pub fn search(&self, query: &SearchQuery) -> Result<Vec<SearchResult>> {
        let mut results = Vec::new();
        
        // Start with name-based search if pattern is provided
        if let Some(pattern) = &query.name_pattern {
            let rows = self.database.search_symbols(pattern)?;
            for row in rows {
                let symbol = SymbolInfo::from(row);
                let score = self.calculate_relevance_score(&symbol, query);
                
                if self.matches_filters(&symbol, query) {
                    results.push(SearchResult {
                        symbol,
                        score,
                        context: None,
                    });
                }
            }
        }
        
        // Sort by relevance score
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        
        // Apply limit
        if let Some(limit) = query.limit {
            results.truncate(limit);
        }
        
        Ok(results)
    }
    
    fn calculate_relevance_score(&self, symbol: &SymbolInfo, query: &SearchQuery) -> f64 {
        let mut score = 0.0;
        
        // Name matching score
        if let Some(pattern) = &query.name_pattern {
            if symbol.name == *pattern {
                score += 100.0; // Exact match
            } else if symbol.name.to_lowercase().contains(&pattern.to_lowercase()) {
                score += 50.0; // Partial match
            } else if symbol.name.to_lowercase().starts_with(&pattern.to_lowercase()) {
                score += 75.0; // Prefix match
            }
        }
        
        // Kind bonus
        match symbol.kind {
            crate::index::symbols::SymbolKind::Package => score += 10.0,
            crate::index::symbols::SymbolKind::Procedure => score += 8.0,
            crate::index::symbols::SymbolKind::Function => score += 8.0,
            _ => score += 5.0,
        }
        
        score
    }
    
    fn matches_filters(&self, symbol: &SymbolInfo, query: &SearchQuery) -> bool {
        // Kind filter
        if let Some(kinds) = &query.kind_filter {
            if !kinds.contains(&symbol.kind.to_string()) {
                return false;
            }
        }
        
        // File pattern filter
        if let Some(pattern) = &query.file_pattern {
            if !symbol.file_path.contains(pattern) {
                return false;
            }
        }
        
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::index::Database;

    #[test]
    fn test_search_query_builder() {
        let query = SearchQuery::new()
            .with_name("test".to_string())
            .with_kinds(vec!["Function".to_string()])
            .with_limit(50)
            .include_docs();
        
        assert_eq!(query.name_pattern, Some("test".to_string()));
        assert_eq!(query.kind_filter, Some(vec!["Function".to_string()]));
        assert_eq!(query.limit, Some(50));
        assert!(query.include_documentation);
    }
    
    #[test]
    fn test_symbol_searcher_creation() {
        let database = Database::in_memory().unwrap();
        let searcher = SymbolSearcher::new(&database);
        
        // Basic test to ensure searcher is created successfully
        let result = searcher.search_by_name("nonexistent");
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }
}
