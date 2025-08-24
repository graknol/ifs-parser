// Diagnostic types for static analysis results

use crate::parser::ast::Span;
use crate::static_analysis::rules::{RuleViolation, Severity};
use serde::{Deserialize, Serialize};

/// A diagnostic message from static analysis
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Diagnostic {
    pub message: String,
    pub span: Span,
    pub severity: Severity,
    pub code: Option<String>,
    pub source: String,
    pub related_information: Vec<DiagnosticRelatedInformation>,
}

/// Related information for a diagnostic
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DiagnosticRelatedInformation {
    pub span: Span,
    pub message: String,
}

impl From<RuleViolation> for Diagnostic {
    fn from(violation: RuleViolation) -> Self {
        Self {
            message: violation.message,
            span: violation.span,
            severity: violation.severity,
            code: Some(violation.rule_id),
            source: "ifs-parser".to_string(),
            related_information: Vec::new(),
        }
    }
}

/// Collection of diagnostics with utility methods
#[derive(Debug, Clone, Default)]
pub struct DiagnosticCollection {
    diagnostics: Vec<Diagnostic>,
}

impl DiagnosticCollection {
    /// Create a new empty diagnostic collection
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Add a diagnostic to the collection
    pub fn add(&mut self, diagnostic: Diagnostic) {
        self.diagnostics.push(diagnostic);
    }
    
    /// Add multiple diagnostics to the collection
    pub fn add_all(&mut self, diagnostics: Vec<Diagnostic>) {
        self.diagnostics.extend(diagnostics);
    }
    
    /// Get all diagnostics
    pub fn all(&self) -> &Vec<Diagnostic> {
        &self.diagnostics
    }
    
    /// Get diagnostics by severity
    pub fn by_severity(&self, severity: Severity) -> Vec<&Diagnostic> {
        self.diagnostics
            .iter()
            .filter(|d| d.severity == severity)
            .collect()
    }
    
    /// Get error count
    pub fn error_count(&self) -> usize {
        self.by_severity(Severity::Error).len()
    }
    
    /// Get warning count
    pub fn warning_count(&self) -> usize {
        self.by_severity(Severity::Warning).len()
    }
    
    /// Check if there are any errors
    pub fn has_errors(&self) -> bool {
        self.error_count() > 0
    }
    
    /// Sort diagnostics by span position
    pub fn sort_by_position(&mut self) {
        self.diagnostics.sort_by(|a, b| {
            a.span.start.line.cmp(&b.span.start.line)
                .then(a.span.start.column.cmp(&b.span.start.column))
        });
    }
    
    /// Filter diagnostics by a predicate
    pub fn filter<F>(&self, predicate: F) -> Vec<&Diagnostic>
    where
        F: Fn(&Diagnostic) -> bool,
    {
        self.diagnostics.iter().filter(|d| predicate(d)).collect()
    }
}

impl FromIterator<Diagnostic> for DiagnosticCollection {
    fn from_iter<T: IntoIterator<Item = Diagnostic>>(iter: T) -> Self {
        Self {
            diagnostics: iter.into_iter().collect(),
        }
    }
}

impl IntoIterator for DiagnosticCollection {
    type Item = Diagnostic;
    type IntoIter = std::vec::IntoIter<Self::Item>;
    
    fn into_iter(self) -> Self::IntoIter {
        self.diagnostics.into_iter()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::ast::Position;

    fn create_test_diagnostic(line: usize, severity: Severity) -> Diagnostic {
        Diagnostic {
            message: "Test diagnostic".to_string(),
            span: Span {
                start: Position { line, column: 1, offset: 0 },
                end: Position { line, column: 10, offset: 9 },
            },
            severity,
            code: Some("test".to_string()),
            source: "ifs-parser".to_string(),
            related_information: Vec::new(),
        }
    }

    #[test]
    fn test_diagnostic_collection() {
        let mut collection = DiagnosticCollection::new();
        
        collection.add(create_test_diagnostic(1, Severity::Error));
        collection.add(create_test_diagnostic(2, Severity::Warning));
        collection.add(create_test_diagnostic(3, Severity::Error));
        
        assert_eq!(collection.all().len(), 3);
        assert_eq!(collection.error_count(), 2);
        assert_eq!(collection.warning_count(), 1);
        assert!(collection.has_errors());
    }
    
    #[test]
    fn test_diagnostic_sorting() {
        let mut collection = DiagnosticCollection::new();
        
        collection.add(create_test_diagnostic(3, Severity::Error));
        collection.add(create_test_diagnostic(1, Severity::Warning));
        collection.add(create_test_diagnostic(2, Severity::Error));
        
        collection.sort_by_position();
        
        let diagnostics = collection.all();
        assert_eq!(diagnostics[0].span.start.line, 1);
        assert_eq!(diagnostics[1].span.start.line, 2);
        assert_eq!(diagnostics[2].span.start.line, 3);
    }
}
