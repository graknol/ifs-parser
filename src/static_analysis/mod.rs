// Static analysis engine for IFS Cloud source code
//
// This module provides rule-based static analysis capabilities:
// - Code quality checks
// - Security vulnerability detection
// - Performance analysis
// - Best practices enforcement

pub mod rules;
pub mod analyzer;
pub mod diagnostics;

pub use rules::*;
pub use analyzer::*;
pub use diagnostics::*;

use crate::parser::ast::AstNode;
use crate::Result;
use std::collections::HashMap;

/// Configuration for static analysis
#[derive(Debug, Clone)]
pub struct AnalysisConfig {
    /// Enable or disable specific rule categories
    pub enabled_categories: Vec<RuleCategory>,
    /// Rule-specific configuration
    pub rule_config: HashMap<String, serde_json::Value>,
    /// Maximum number of diagnostics to report per file
    pub max_diagnostics: usize,
}

impl Default for AnalysisConfig {
    fn default() -> Self {
        Self {
            enabled_categories: vec![
                RuleCategory::CodeQuality,
                RuleCategory::Performance,
                RuleCategory::Security,
                RuleCategory::BestPractices,
            ],
            rule_config: HashMap::new(),
            max_diagnostics: 100,
        }
    }
}

/// Run static analysis on an AST node
pub fn analyze(ast: &AstNode, config: &AnalysisConfig) -> Result<Vec<Diagnostic>> {
    let mut analyzer = Analyzer::new(config.clone());
    analyzer.analyze(ast)
}
