// Static analyzer implementation

use crate::parser::ast::*;
use crate::static_analysis::{
    diagnostics::{Diagnostic, DiagnosticCollection},
    rules::{RuleRegistry, RuleCategory, Severity},
    AnalysisConfig,
};
use crate::Result;

/// The main static analyzer
pub struct Analyzer {
    config: AnalysisConfig,
    rule_registry: RuleRegistry,
}

impl Analyzer {
    /// Create a new analyzer with the given configuration
    pub fn new(config: AnalysisConfig) -> Self {
        Self {
            config,
            rule_registry: RuleRegistry::new(),
        }
    }
    
    /// Analyze an AST node and return diagnostics
    pub fn analyze(&mut self, ast: &AstNode) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = DiagnosticCollection::new();
        
        // Run enabled rule categories
        for category in &self.config.enabled_categories {
            let category_diagnostics = self.analyze_category(ast, category)?;
            diagnostics.add_all(category_diagnostics);
        }
        
        // Limit the number of diagnostics if configured
        let mut result = diagnostics.all().clone();
        if result.len() > self.config.max_diagnostics {
            result.truncate(self.config.max_diagnostics);
        }
        
        Ok(result)
    }
    
    /// Analyze with a specific rule category
    fn analyze_category(&self, ast: &AstNode, category: &RuleCategory) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = Vec::new();
        let rules = self.rule_registry.get_rules_by_category(category);
        
        for rule in rules {
            let violations = (rule.checker)(ast, &self.config.rule_config);
            for violation in violations {
                diagnostics.push(violation.into());
            }
        }
        
        Ok(diagnostics)
    }
    
    /// Analyze a specific language construct
    pub fn analyze_plsql(&self, node: &PlSqlNode) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = Vec::new();
        
        match node {
            PlSqlNode::Package { name, declarations, body, .. } => {
                // Analyze package structure
                diagnostics.extend(self.analyze_package_naming(name)?);
                
                // Analyze declarations
                for declaration in declarations {
                    diagnostics.extend(self.analyze_declaration(declaration)?);
                }
                
                // Analyze body if present
                if let Some(body_statements) = body {
                    for statement in body_statements {
                        diagnostics.extend(self.analyze_statement(statement)?);
                    }
                }
            }
            
            PlSqlNode::Procedure { name, parameters, body, .. } => {
                diagnostics.extend(self.analyze_procedure_naming(name)?);
                diagnostics.extend(self.analyze_parameters(parameters)?);
                
                for statement in body {
                    diagnostics.extend(self.analyze_statement(statement)?);
                }
            }
            
            PlSqlNode::Function { name, parameters, return_type, body, .. } => {
                diagnostics.extend(self.analyze_function_naming(name)?);
                diagnostics.extend(self.analyze_parameters(parameters)?);
                diagnostics.extend(self.analyze_return_type(return_type)?);
                
                for statement in body {
                    diagnostics.extend(self.analyze_statement(statement)?);
                }
            }
        }
        
        Ok(diagnostics)
    }
    
    // Specific analysis methods
    
    fn analyze_package_naming(&self, name: &Identifier) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = Vec::new();
        
        // Check naming conventions
        if !name.name.ends_with("_API") && !name.name.ends_with("_PKG") {
            diagnostics.push(Diagnostic {
                message: "Package names should end with '_API' or '_PKG'".to_string(),
                span: name.span.clone(),
                severity: Severity::Info,
                code: Some("package-naming".to_string()),
                source: "ifs-parser".to_string(),
                related_information: Vec::new(),
            });
        }
        
        Ok(diagnostics)
    }
    
    fn analyze_procedure_naming(&self, name: &Identifier) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = Vec::new();
        
        // Check for proper naming conventions
        if name.name.chars().next().map_or(false, |c| c.is_lowercase()) {
            diagnostics.push(Diagnostic {
                message: "Procedure names should start with uppercase letter".to_string(),
                span: name.span.clone(),
                severity: Severity::Info,
                code: Some("procedure-naming".to_string()),
                source: "ifs-parser".to_string(),
                related_information: Vec::new(),
            });
        }
        
        Ok(diagnostics)
    }
    
    fn analyze_function_naming(&self, name: &Identifier) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = Vec::new();
        
        // Check for proper naming conventions
        if name.name.chars().next().map_or(false, |c| c.is_lowercase()) {
            diagnostics.push(Diagnostic {
                message: "Function names should start with uppercase letter".to_string(),
                span: name.span.clone(),
                severity: Severity::Info,
                code: Some("function-naming".to_string()),
                source: "ifs-parser".to_string(),
                related_information: Vec::new(),
            });
        }
        
        Ok(diagnostics)
    }
    
    fn analyze_parameters(&self, parameters: &[Parameter]) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = Vec::new();
        
        // Check for too many parameters
        if parameters.len() > 10 {
            if let Some(first_param) = parameters.first() {
                diagnostics.push(Diagnostic {
                    message: format!("Too many parameters ({}). Consider using a record type.", parameters.len()),
                    span: first_param.span.clone(),
                    severity: Severity::Warning,
                    code: Some("too-many-parameters".to_string()),
                    source: "ifs-parser".to_string(),
                    related_information: Vec::new(),
                });
            }
        }
        
        Ok(diagnostics)
    }
    
    fn analyze_return_type(&self, _return_type: &Type) -> Result<Vec<Diagnostic>> {
        // Placeholder for return type analysis
        Ok(Vec::new())
    }
    
    fn analyze_declaration(&self, _declaration: &PlSqlDeclaration) -> Result<Vec<Diagnostic>> {
        // Placeholder for declaration analysis
        Ok(Vec::new())
    }
    
    fn analyze_statement(&self, statement: &PlSqlStatement) -> Result<Vec<Diagnostic>> {
        let mut diagnostics = Vec::new();
        
        match statement {
            PlSqlStatement::Assignment { .. } => {
                // Analyze assignment statements
            }
            
            PlSqlStatement::If { condition, then_branch, else_branch, .. } => {
                // Analyze condition complexity
                diagnostics.extend(self.analyze_expression(condition)?);
                
                // Analyze branches
                for stmt in then_branch {
                    diagnostics.extend(self.analyze_statement(stmt)?);
                }
                
                if let Some(else_stmts) = else_branch {
                    for stmt in else_stmts {
                        diagnostics.extend(self.analyze_statement(stmt)?);
                    }
                }
            }
            
            PlSqlStatement::Loop { body, .. } => {
                // Analyze loop body
                for stmt in body {
                    diagnostics.extend(self.analyze_statement(stmt)?);
                }
            }
            
            PlSqlStatement::Return { .. } => {
                // Analyze return statements
            }
            
            PlSqlStatement::Call { .. } => {
                // Analyze procedure/function calls
            }
        }
        
        Ok(diagnostics)
    }
    
    fn analyze_expression(&self, _expression: &Expression) -> Result<Vec<Diagnostic>> {
        // Placeholder for expression analysis
        Ok(Vec::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parser::ast::Position;

    #[test]
    fn test_analyzer_creation() {
        let config = AnalysisConfig::default();
        let analyzer = Analyzer::new(config);
        
        // Basic test to ensure analyzer is created successfully
        assert_eq!(analyzer.config.max_diagnostics, 100);
    }
    
    #[test]
    fn test_package_naming_analysis() {
        let config = AnalysisConfig::default();
        let analyzer = Analyzer::new(config);
        
        let name = Identifier {
            name: "invalid_name".to_string(),
            span: Span {
                start: Position { line: 1, column: 1, offset: 0 },
                end: Position { line: 1, column: 12, offset: 11 },
            },
        };
        
        let diagnostics = analyzer.analyze_package_naming(&name).unwrap();
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("should end with"));
    }
}
