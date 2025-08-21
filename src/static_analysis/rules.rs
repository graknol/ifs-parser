// Rule definitions for static analysis
//
// This module defines the rules that can be applied during static analysis

use crate::parser::ast::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Categories of analysis rules
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RuleCategory {
    CodeQuality,
    Performance,
    Security,
    BestPractices,
    Maintainability,
}

/// Severity levels for rule violations
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Severity {
    Error,
    Warning,
    Info,
    Hint,
}

/// A static analysis rule
#[derive(Debug, Clone)]
pub struct Rule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: RuleCategory,
    pub severity: Severity,
    pub checker: RuleChecker,
}

/// Function type for rule checkers
pub type RuleChecker = fn(&AstNode, &HashMap<String, serde_json::Value>) -> Vec<RuleViolation>;

/// A violation of a static analysis rule
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RuleViolation {
    pub rule_id: String,
    pub message: String,
    pub span: Span,
    pub severity: Severity,
    pub suggestion: Option<String>,
}

/// Registry of all available rules
pub struct RuleRegistry {
    rules: HashMap<String, Rule>,
}

impl RuleRegistry {
    /// Create a new rule registry with default rules
    pub fn new() -> Self {
        let mut registry = Self {
            rules: HashMap::new(),
        };
        registry.register_default_rules();
        registry
    }
    
    /// Register a new rule
    pub fn register(&mut self, rule: Rule) {
        self.rules.insert(rule.id.clone(), rule);
    }
    
    /// Get all rules in a category
    pub fn get_rules_by_category(&self, category: &RuleCategory) -> Vec<&Rule> {
        self.rules
            .values()
            .filter(|rule| rule.category == *category)
            .collect()
    }
    
    /// Get a rule by ID
    pub fn get_rule(&self, id: &str) -> Option<&Rule> {
        self.rules.get(id)
    }
    
    /// Get all registered rules
    pub fn get_all_rules(&self) -> Vec<&Rule> {
        self.rules.values().collect()
    }
    
    fn register_default_rules(&mut self) {
        // Code quality rules
        self.register(Rule {
            id: "unused-variable".to_string(),
            name: "Unused Variable".to_string(),
            description: "Variables that are declared but never used".to_string(),
            category: RuleCategory::CodeQuality,
            severity: Severity::Warning,
            checker: check_unused_variables,
        });
        
        self.register(Rule {
            id: "empty-catch-block".to_string(),
            name: "Empty Catch Block".to_string(),
            description: "Exception handlers with empty bodies".to_string(),
            category: RuleCategory::CodeQuality,
            severity: Severity::Warning,
            checker: check_empty_catch_blocks,
        });
        
        // Performance rules
        self.register(Rule {
            id: "inefficient-loop".to_string(),
            name: "Inefficient Loop".to_string(),
            description: "Loops that could be optimized".to_string(),
            category: RuleCategory::Performance,
            severity: Severity::Info,
            checker: check_inefficient_loops,
        });
        
        // Security rules
        self.register(Rule {
            id: "sql-injection-risk".to_string(),
            name: "SQL Injection Risk".to_string(),
            description: "Potential SQL injection vulnerabilities".to_string(),
            category: RuleCategory::Security,
            severity: Severity::Error,
            checker: check_sql_injection_risks,
        });
        
        // Best practices rules
        self.register(Rule {
            id: "missing-exception-handling".to_string(),
            name: "Missing Exception Handling".to_string(),
            description: "Procedures that should have exception handling".to_string(),
            category: RuleCategory::BestPractices,
            severity: Severity::Info,
            checker: check_missing_exception_handling,
        });
    }
}

impl Default for RuleRegistry {
    fn default() -> Self {
        Self::new()
    }
}

// Rule checker implementations (simplified for now)

fn check_unused_variables(_ast: &AstNode, _config: &HashMap<String, serde_json::Value>) -> Vec<RuleViolation> {
    // TODO: Implement unused variable detection
    Vec::new()
}

fn check_empty_catch_blocks(_ast: &AstNode, _config: &HashMap<String, serde_json::Value>) -> Vec<RuleViolation> {
    // TODO: Implement empty catch block detection
    Vec::new()
}

fn check_inefficient_loops(_ast: &AstNode, _config: &HashMap<String, serde_json::Value>) -> Vec<RuleViolation> {
    // TODO: Implement inefficient loop detection
    Vec::new()
}

fn check_sql_injection_risks(_ast: &AstNode, _config: &HashMap<String, serde_json::Value>) -> Vec<RuleViolation> {
    // TODO: Implement SQL injection risk detection
    Vec::new()
}

fn check_missing_exception_handling(_ast: &AstNode, _config: &HashMap<String, serde_json::Value>) -> Vec<RuleViolation> {
    // TODO: Implement missing exception handling detection
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rule_registry() {
        let registry = RuleRegistry::new();
        
        assert!(!registry.get_all_rules().is_empty());
        assert!(registry.get_rule("unused-variable").is_some());
        
        let quality_rules = registry.get_rules_by_category(&RuleCategory::CodeQuality);
        assert!(!quality_rules.is_empty());
    }
}
