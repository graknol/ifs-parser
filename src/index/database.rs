// Database interface for the index

use crate::parser::Language;
use crate::Result;
use rusqlite::{params, Connection, Row};
use std::collections::HashMap;
use std::path::Path;

/// Database wrapper for storing indexed information
pub struct Database {
    conn: Connection,
}

impl Database {
    /// Create a new database connection
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let mut db = Self { conn };
        db.initialize_schema()?;
        Ok(db)
    }
    
    /// Create an in-memory database for testing
    pub fn in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let mut db = Self { conn };
        db.initialize_schema()?;
        Ok(db)
    }
    
    /// Initialize the database schema
    fn initialize_schema(&mut self) -> Result<()> {
        self.conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT UNIQUE NOT NULL,
                language TEXT NOT NULL,
                indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_size INTEGER,
                hash TEXT
            );
            
            CREATE TABLE IF NOT EXISTS symbols (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                kind TEXT NOT NULL,
                start_line INTEGER NOT NULL,
                start_column INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                end_column INTEGER NOT NULL,
                start_offset INTEGER NOT NULL,
                end_offset INTEGER NOT NULL,
                parent_id INTEGER,
                signature TEXT,
                documentation TEXT,
                FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES symbols (id) ON DELETE CASCADE
            );
            
            CREATE TABLE IF NOT EXISTS references (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol_id INTEGER NOT NULL,
                file_id INTEGER NOT NULL,
                start_line INTEGER NOT NULL,
                start_column INTEGER NOT NULL,
                end_line INTEGER NOT NULL,
                end_column INTEGER NOT NULL,
                start_offset INTEGER NOT NULL,
                end_offset INTEGER NOT NULL,
                reference_kind TEXT NOT NULL,
                FOREIGN KEY (symbol_id) REFERENCES symbols (id) ON DELETE CASCADE,
                FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols (name);
            CREATE INDEX IF NOT EXISTS idx_symbols_kind ON symbols (kind);
            CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols (file_id);
            CREATE INDEX IF NOT EXISTS idx_references_symbol ON references (symbol_id);
            CREATE INDEX IF NOT EXISTS idx_references_file ON references (file_id);
            CREATE INDEX IF NOT EXISTS idx_files_path ON files (path);
            "#,
        )?;
        
        Ok(())
    }
    
    /// Store file metadata
    pub fn store_file<P: AsRef<Path>>(&mut self, path: P, language: Language) -> Result<i64> {
        let path_str = path.as_ref().to_string_lossy();
        let language_str = format!("{:?}", language);
        
        self.conn.execute(
            "INSERT OR REPLACE INTO files (path, language) VALUES (?1, ?2)",
            params![path_str, language_str],
        )?;
        
        Ok(self.conn.last_insert_rowid())
    }
    
    /// Get file ID by path
    pub fn get_file_id<P: AsRef<Path>>(&self, path: P) -> Result<Option<i64>> {
        let path_str = path.as_ref().to_string_lossy();
        let mut stmt = self.conn.prepare("SELECT id FROM files WHERE path = ?1")?;
        
        let mut rows = stmt.query_map(params![path_str], |row| {
            Ok(row.get::<_, i64>(0)?)
        })?;
        
        if let Some(row) = rows.next() {
            Ok(Some(row?))
        } else {
            Ok(None)
        }
    }
    
    /// Store a symbol
    pub fn store_symbol(
        &mut self,
        file_id: i64,
        name: &str,
        kind: &str,
        start_line: usize,
        start_column: usize,
        end_line: usize,
        end_column: usize,
        start_offset: usize,
        end_offset: usize,
        parent_id: Option<i64>,
        signature: Option<&str>,
        documentation: Option<&str>,
    ) -> Result<i64> {
        self.conn.execute(
            r#"
            INSERT INTO symbols 
            (file_id, name, kind, start_line, start_column, end_line, end_column, 
             start_offset, end_offset, parent_id, signature, documentation)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            "#,
            params![
                file_id,
                name,
                kind,
                start_line as i64,
                start_column as i64,
                end_line as i64,
                end_column as i64,
                start_offset as i64,
                end_offset as i64,
                parent_id,
                signature,
                documentation
            ],
        )?;
        
        Ok(self.conn.last_insert_rowid())
    }
    
    /// Store a reference
    pub fn store_reference(
        &mut self,
        symbol_id: i64,
        file_id: i64,
        start_line: usize,
        start_column: usize,
        end_line: usize,
        end_column: usize,
        start_offset: usize,
        end_offset: usize,
        reference_kind: &str,
    ) -> Result<i64> {
        self.conn.execute(
            r#"
            INSERT INTO references 
            (symbol_id, file_id, start_line, start_column, end_line, end_column,
             start_offset, end_offset, reference_kind)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                symbol_id,
                file_id,
                start_line as i64,
                start_column as i64,
                end_line as i64,
                end_column as i64,
                start_offset as i64,
                end_offset as i64,
                reference_kind
            ],
        )?;
        
        Ok(self.conn.last_insert_rowid())
    }
    
    /// Search symbols by name pattern
    pub fn search_symbols(&self, pattern: &str) -> Result<Vec<SymbolRow>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT s.id, s.file_id, f.path, s.name, s.kind, 
                   s.start_line, s.start_column, s.end_line, s.end_column,
                   s.start_offset, s.end_offset, s.signature, s.documentation
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            WHERE s.name LIKE ?1
            ORDER BY s.name
            "#,
        )?;
        
        let rows = stmt.query_map(params![format!("%{}%", pattern)], |row| {
            Ok(SymbolRow::from_row(row)?)
        })?;
        
        let mut symbols = Vec::new();
        for row in rows {
            symbols.push(row?);
        }
        
        Ok(symbols)
    }
    
    /// Find references for a symbol
    pub fn find_references(&self, symbol_id: i64) -> Result<Vec<ReferenceRow>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT r.id, r.symbol_id, r.file_id, f.path,
                   r.start_line, r.start_column, r.end_line, r.end_column,
                   r.start_offset, r.end_offset, r.reference_kind
            FROM references r
            JOIN files f ON r.file_id = f.id
            WHERE r.symbol_id = ?1
            ORDER BY f.path, r.start_line, r.start_column
            "#,
        )?;
        
        let rows = stmt.query_map(params![symbol_id], |row| {
            Ok(ReferenceRow::from_row(row)?)
        })?;
        
        let mut references = Vec::new();
        for row in rows {
            references.push(row?);
        }
        
        Ok(references)
    }
    
    /// Get symbols in a file
    pub fn get_file_symbols<P: AsRef<Path>>(&self, path: P) -> Result<Vec<SymbolRow>> {
        let path_str = path.as_ref().to_string_lossy();
        let mut stmt = self.conn.prepare(
            r#"
            SELECT s.id, s.file_id, f.path, s.name, s.kind,
                   s.start_line, s.start_column, s.end_line, s.end_column,
                   s.start_offset, s.end_offset, s.signature, s.documentation
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            WHERE f.path = ?1
            ORDER BY s.start_line, s.start_column
            "#,
        )?;
        
        let rows = stmt.query_map(params![path_str], |row| {
            Ok(SymbolRow::from_row(row)?)
        })?;
        
        let mut symbols = Vec::new();
        for row in rows {
            symbols.push(row?);
        }
        
        Ok(symbols)
    }
    
    /// Get statistics about the index
    pub fn get_statistics(&self) -> Result<super::IndexStatistics> {
        let total_files: usize = self.conn.query_row(
            "SELECT COUNT(*) FROM files",
            [],
            |row| Ok(row.get::<_, i64>(0)? as usize),
        )?;
        
        let total_symbols: usize = self.conn.query_row(
            "SELECT COUNT(*) FROM symbols",
            [],
            |row| Ok(row.get::<_, i64>(0)? as usize),
        )?;
        
        let total_references: usize = self.conn.query_row(
            "SELECT COUNT(*) FROM references",
            [],
            |row| Ok(row.get::<_, i64>(0)? as usize),
        )?;
        
        // Get symbols by language
        let mut stmt = self.conn.prepare(
            "SELECT f.language, COUNT(s.id) FROM files f LEFT JOIN symbols s ON f.id = s.file_id GROUP BY f.language"
        )?;
        
        let mut symbols_by_language = HashMap::new();
        let rows = stmt.query_map([], |row| {
            let language_str: String = row.get(0)?;
            let count: i64 = row.get(1)?;
            Ok((language_str, count as usize))
        })?;
        
        for row in rows {
            let (language_str, count) = row?;
            if let Ok(language) = language_str.parse::<Language>() {
                symbols_by_language.insert(language, count);
            }
        }
        
        Ok(super::IndexStatistics {
            total_files,
            total_symbols,
            total_references,
            symbols_by_language,
        })
    }
    
    /// Clear all data
    pub fn clear_all(&mut self) -> Result<()> {
        self.conn.execute_batch(
            r#"
            DELETE FROM references;
            DELETE FROM symbols;
            DELETE FROM files;
            "#,
        )?;
        Ok(())
    }
}

/// Helper for parsing language from string
impl std::str::FromStr for Language {
    type Err = ();
    
    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s {
            "PlSql" => Ok(Language::PlSql),
            "Entity" => Ok(Language::Entity),
            "Enumeration" => Ok(Language::Enumeration),
            "Views" => Ok(Language::Views),
            "Storage" => Ok(Language::Storage),
            "MarbleProjection" => Ok(Language::MarbleProjection),
            "MarbleClient" => Ok(Language::MarbleClient),
            _ => Err(()),
        }
    }
}

/// Symbol data from database
#[derive(Debug, Clone)]
pub struct SymbolRow {
    pub id: i64,
    pub file_id: i64,
    pub file_path: String,
    pub name: String,
    pub kind: String,
    pub start_line: usize,
    pub start_column: usize,
    pub end_line: usize,
    pub end_column: usize,
    pub start_offset: usize,
    pub end_offset: usize,
    pub signature: Option<String>,
    pub documentation: Option<String>,
}

impl SymbolRow {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get(0)?,
            file_id: row.get(1)?,
            file_path: row.get(2)?,
            name: row.get(3)?,
            kind: row.get(4)?,
            start_line: row.get::<_, i64>(5)? as usize,
            start_column: row.get::<_, i64>(6)? as usize,
            end_line: row.get::<_, i64>(7)? as usize,
            end_column: row.get::<_, i64>(8)? as usize,
            start_offset: row.get::<_, i64>(9)? as usize,
            end_offset: row.get::<_, i64>(10)? as usize,
            signature: row.get(11)?,
            documentation: row.get(12)?,
        })
    }
}

/// Reference data from database
#[derive(Debug, Clone)]
pub struct ReferenceRow {
    pub id: i64,
    pub symbol_id: i64,
    pub file_id: i64,
    pub file_path: String,
    pub start_line: usize,
    pub start_column: usize,
    pub end_line: usize,
    pub end_column: usize,
    pub start_offset: usize,
    pub end_offset: usize,
    pub reference_kind: String,
}

impl ReferenceRow {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Self {
            id: row.get(0)?,
            symbol_id: row.get(1)?,
            file_id: row.get(2)?,
            file_path: row.get(3)?,
            start_line: row.get::<_, i64>(4)? as usize,
            start_column: row.get::<_, i64>(5)? as usize,
            end_line: row.get::<_, i64>(6)? as usize,
            end_column: row.get::<_, i64>(7)? as usize,
            start_offset: row.get::<_, i64>(8)? as usize,
            end_offset: row.get::<_, i64>(9)? as usize,
            reference_kind: row.get(10)?,
        })
    }
}
