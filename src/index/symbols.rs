// Symbol indexing and management

use crate::index::database::{Database, SymbolRow};
use crate::parser::ast::*;
use crate::Result;
use std::path::Path;
use serde::{Deserialize, Serialize};

/// Information about a symbol
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SymbolInfo {
    pub id: Option<i64>,
    pub name: String,
    pub kind: SymbolKind,
    pub span: Span,
    pub file_path: String,
    pub signature: Option<String>,
    pub documentation: Option<String>,
    pub parent: Option<Box<SymbolInfo>>,
}

/// Types of symbols
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SymbolKind {
    Package,
    Procedure,
    Function,
    Variable,
    Parameter,
    Type,
    Constant,
    Exception,
    Cursor,
    Entity,
    EntityAttribute,
    EntityKey,
    Enumeration,
    EnumerationValue,
    View,
    ViewColumn,
    Projection,
    ProjectionAttribute,
    ProjectionAction,
    Client,
    ClientLayout,
    ClientCommand,
}

impl std::fmt::Display for SymbolKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SymbolKind::Package => write!(f, "Package"),
            SymbolKind::Procedure => write!(f, "Procedure"),
            SymbolKind::Function => write!(f, "Function"),
            SymbolKind::Variable => write!(f, "Variable"),
            SymbolKind::Parameter => write!(f, "Parameter"),
            SymbolKind::Type => write!(f, "Type"),
            SymbolKind::Constant => write!(f, "Constant"),
            SymbolKind::Exception => write!(f, "Exception"),
            SymbolKind::Cursor => write!(f, "Cursor"),
            SymbolKind::Entity => write!(f, "Entity"),
            SymbolKind::EntityAttribute => write!(f, "Entity Attribute"),
            SymbolKind::EntityKey => write!(f, "Entity Key"),
            SymbolKind::Enumeration => write!(f, "Enumeration"),
            SymbolKind::EnumerationValue => write!(f, "Enumeration Value"),
            SymbolKind::View => write!(f, "View"),
            SymbolKind::ViewColumn => write!(f, "View Column"),
            SymbolKind::Projection => write!(f, "Projection"),
            SymbolKind::ProjectionAttribute => write!(f, "Projection Attribute"),
            SymbolKind::ProjectionAction => write!(f, "Projection Action"),
            SymbolKind::Client => write!(f, "Client"),
            SymbolKind::ClientLayout => write!(f, "Client Layout"),
            SymbolKind::ClientCommand => write!(f, "Client Command"),
        }
    }
}

/// Reference to a symbol
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SymbolReference {
    pub symbol: SymbolInfo,
    pub span: Span,
    pub file_path: String,
    pub reference_kind: ReferenceKind,
}

/// Types of symbol references
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ReferenceKind {
    Definition,
    Usage,
    Call,
    Assignment,
    Declaration,
}

impl std::fmt::Display for ReferenceKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReferenceKind::Definition => write!(f, "Definition"),
            ReferenceKind::Usage => write!(f, "Usage"),
            ReferenceKind::Call => write!(f, "Call"),
            ReferenceKind::Assignment => write!(f, "Assignment"),
            ReferenceKind::Declaration => write!(f, "Declaration"),
        }
    }
}

/// Symbol indexer for extracting symbols from AST nodes
pub struct SymbolIndexer<'a> {
    database: &'a mut Database,
}

impl<'a> SymbolIndexer<'a> {
    /// Create a new symbol indexer
    pub fn new(database: &'a mut Database) -> Self {
        Self { database }
    }
    
    /// Index an AST node and extract all symbols
    pub fn index_ast<P: AsRef<Path>>(&mut self, file_path: P, ast: &AstNode) -> Result<()> {
        let file_id = match self.database.get_file_id(&file_path)? {
            Some(id) => id,
            None => {
                let language = super::detect_language_from_path(file_path.as_ref());
                self.database.store_file(&file_path, language)?
            }
        };
        
        match ast {
            AstNode::PlSql(node) => self.index_plsql_node(file_id, &file_path, node, None)?,
            AstNode::Entity(node) => self.index_entity_node(file_id, &file_path, node)?,
            AstNode::Enumeration(node) => self.index_enumeration_node(file_id, &file_path, node)?,
            AstNode::Views(node) => self.index_views_node(file_id, &file_path, node)?,
            AstNode::Storage(node) => self.index_storage_node(file_id, &file_path, node)?,
            AstNode::MarbleProjection(node) => self.index_marble_projection_node(file_id, &file_path, node)?,
            AstNode::MarbleClient(node) => self.index_marble_client_node(file_id, &file_path, node)?,
        }
        
        Ok(())
    }
    
    fn index_plsql_node<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        file_path: P,
        node: &PlSqlNode,
        parent_id: Option<i64>,
    ) -> Result<()> {
        match node {
            PlSqlNode::Package { name, declarations, body, span: _, .. } => {
                let symbol_id = self.store_symbol(
                    file_id,
                    &name.name,
                    SymbolKind::Package,
                    &name.span,
                    parent_id,
                    None,
                    None,
                )?;
                
                // Index declarations
                for declaration in declarations {
                    self.index_plsql_declaration(file_id, &file_path, declaration, Some(symbol_id))?;
                }
                
                // Index body statements
                if let Some(body_statements) = body {
                    for statement in body_statements {
                        self.index_plsql_statement(file_id, &file_path, statement, Some(symbol_id))?;
                    }
                }
            }
            
            PlSqlNode::Procedure { name, parameters, body, span: _, .. } => {
                let signature = self.build_procedure_signature(name, parameters);
                let symbol_id = self.store_symbol(
                    file_id,
                    &name.name,
                    SymbolKind::Procedure,
                    &name.span,
                    parent_id,
                    Some(&signature),
                    None,
                )?;
                
                // Index parameters
                for parameter in parameters {
                    self.index_parameter(file_id, &file_path, parameter, Some(symbol_id))?;
                }
                
                // Index body statements
                for statement in body {
                    self.index_plsql_statement(file_id, &file_path, statement, Some(symbol_id))?;
                }
            }
            
            PlSqlNode::Function { name, parameters, return_type, body, span: _, .. } => {
                let signature = self.build_function_signature(name, parameters, return_type);
                let symbol_id = self.store_symbol(
                    file_id,
                    &name.name,
                    SymbolKind::Function,
                    &name.span,
                    parent_id,
                    Some(&signature),
                    None,
                )?;
                
                // Index parameters
                for parameter in parameters {
                    self.index_parameter(file_id, &file_path, parameter, Some(symbol_id))?;
                }
                
                // Index body statements
                for statement in body {
                    self.index_plsql_statement(file_id, &file_path, statement, Some(symbol_id))?;
                }
            }
        }
        
        Ok(())
    }
    
    fn index_plsql_declaration<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        declaration: &PlSqlDeclaration,
        parent_id: Option<i64>,
    ) -> Result<()> {
        match declaration {
            PlSqlDeclaration::Variable { name, type_name, default_value: _, span: _ } => {
                self.store_symbol(
                    file_id,
                    &name.name,
                    SymbolKind::Variable,
                    &name.span,
                    parent_id,
                    Some(&type_name.name),
                    None,
                )?;
            }
            
            PlSqlDeclaration::Cursor { name, query, span: _ } => {
                self.store_symbol(
                    file_id,
                    &name.name,
                    SymbolKind::Cursor,
                    &name.span,
                    parent_id,
                    Some(query),
                    None,
                )?;
            }
            
            PlSqlDeclaration::Exception { name, span: _ } => {
                self.store_symbol(
                    file_id,
                    &name.name,
                    SymbolKind::Exception,
                    &name.span,
                    parent_id,
                    None,
                    None,
                )?;
            }
        }
        
        Ok(())
    }
    
    fn index_plsql_statement<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        file_path: P,
        statement: &PlSqlStatement,
        parent_id: Option<i64>,
    ) -> Result<()> {
        match statement {
            PlSqlStatement::Assignment { target, value: _, span: _ } => {
                // Store reference to the target variable
                self.store_reference(
                    file_id,
                    &target.name,
                    &target.span,
                    ReferenceKind::Assignment,
                )?;
            }
            
            PlSqlStatement::If { condition: _, then_branch, else_branch, span: _ } => {
                // Index expressions and statements in branches
                for stmt in then_branch {
                    self.index_plsql_statement(file_id, &file_path, stmt, parent_id)?;
                }
                
                if let Some(else_stmts) = else_branch {
                    for stmt in else_stmts {
                        self.index_plsql_statement(file_id, &file_path, stmt, parent_id)?;
                    }
                }
            }
            
            PlSqlStatement::Loop { body, span: _ } => {
                for stmt in body {
                    self.index_plsql_statement(file_id, &file_path, stmt, parent_id)?;
                }
            }
            
            PlSqlStatement::Return { value: _, span: _ } => {
                // Index return statement
            }
            
            PlSqlStatement::Call { name, arguments: _, span: _ } => {
                // Store reference to the called procedure/function
                self.store_reference(
                    file_id,
                    &name.name,
                    &name.span,
                    ReferenceKind::Call,
                )?;
            }
        }
        
        Ok(())
    }
    
    fn index_parameter<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        parameter: &Parameter,
        parent_id: Option<i64>,
    ) -> Result<()> {
        let signature = format!("{} {:?}", parameter.param_type.name, parameter.mode);
        
        self.store_symbol(
            file_id,
            &parameter.name.name,
            SymbolKind::Parameter,
            &parameter.name.span,
            parent_id,
            Some(&signature),
            None,
        )?;
        
        Ok(())
    }
    
    fn index_entity_node<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        node: &EntityNode,
    ) -> Result<()> {
        let symbol_id = self.store_symbol(
            file_id,
            &node.entity_name.name,
            SymbolKind::Entity,
            &node.entity_name.span,
            None,
            None,
            None,
        )?;
        
        // Index attributes
        for attribute in &node.attributes {
            self.store_symbol(
                file_id,
                &attribute.name.name,
                SymbolKind::EntityAttribute,
                &attribute.name.span,
                Some(symbol_id),
                Some(&attribute.data_type),
                None,
            )?;
        }
        
        // Index keys
        for key in &node.keys {
            self.store_symbol(
                file_id,
                &key.name.name,
                SymbolKind::EntityKey,
                &key.name.span,
                Some(symbol_id),
                None,
                None,
            )?;
        }
        
        Ok(())
    }
    
    fn index_enumeration_node<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        node: &EnumerationNode,
    ) -> Result<()> {
        let symbol_id = self.store_symbol(
            file_id,
            &node.enumeration_name.name,
            SymbolKind::Enumeration,
            &node.enumeration_name.span,
            None,
            None,
            None,
        )?;
        
        // Index enumeration values
        for value in &node.values {
            self.store_symbol(
                file_id,
                &value.name.name,
                SymbolKind::EnumerationValue,
                &value.name.span,
                Some(symbol_id),
                Some(&value.client_value.as_deref().unwrap_or("")),
                None,
            )?;
        }
        
        Ok(())
    }
    
    fn index_views_node<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        node: &ViewsNode,
    ) -> Result<()> {
        // Index each view definition
        for view in &node.views {
            let symbol_id = self.store_symbol(
                file_id,
                &view.name.name,
                SymbolKind::View,
                &view.name.span,
                None,
                None,
                None,
            )?;
            
            // Index view columns
            for column in &view.columns {
                self.store_symbol(
                    file_id,
                    &column.name.name,
                    SymbolKind::ViewColumn,
                    &column.name.span,
                    Some(symbol_id),
                    column.datatype.as_deref(),
                    None,
                )?;
            }
        }
        
        Ok(())
    }
    
    fn index_storage_node<P: AsRef<std::path::Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        node: &StorageNode,
    ) -> Result<()> {
        // Index storage definitions (tables, indexes, sequences)
        for definition in &node.definitions {
            match definition {
                StorageDefinition::Table { name, columns, constraints, .. } => {
                    let symbol_id = self.store_symbol(
                        file_id,
                        &name.name,
                        SymbolKind::Entity, // Using Entity as closest match for Table
                        &name.span,
                        None,
                        None,
                        None,
                    )?;
                    
                    // Index table columns
                    for column in columns {
                        self.store_symbol(
                            file_id,
                            &column.name.name,
                            SymbolKind::EntityAttribute, // Using EntityAttribute for table columns
                            &column.name.span,
                            Some(symbol_id),
                            Some(&column.data_type),
                            None,
                        )?;
                    }
                    
                    // Index constraints
                    for constraint in constraints {
                        match constraint {
                            TableConstraint::PrimaryKey { name, .. } => {
                                self.store_symbol(
                                    file_id,
                                    &name.name,
                                    SymbolKind::EntityKey, // Using EntityKey for PrimaryKey
                                    &name.span,
                                    Some(symbol_id),
                                    None,
                                    None,
                                )?;
                            }
                            TableConstraint::UniqueConstraint { name, .. } => {
                                self.store_symbol(
                                    file_id,
                                    &name.name,
                                    SymbolKind::EntityKey, // Using EntityKey for UniqueConstraint
                                    &name.span,
                                    Some(symbol_id),
                                    None,
                                    None,
                                )?;
                            }
                        }
                    }
                }
                StorageDefinition::Index { name, .. } => {
                    self.store_symbol(
                        file_id,
                        &name.name,
                        SymbolKind::Entity, // Using Entity for Index
                        &name.span,
                        None,
                        None,
                        None,
                    )?;
                }
                StorageDefinition::Sequence { name, .. } => {
                    self.store_symbol(
                        file_id,
                        &name.name,
                        SymbolKind::Entity, // Using Entity for Sequence
                        &name.span,
                        None,
                        None,
                        None,
                    )?;
                }
            }
        }
        
        Ok(())
    }

    fn index_marble_projection_node<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        node: &MarbleProjectionNode,
    ) -> Result<()> {
        let symbol_id = self.store_symbol(
            file_id,
            &node.name.name,
            SymbolKind::Projection,
            &node.name.span,
            None,
            None,
            None,
        )?;
        
        // Index attributes
        for attribute in &node.attributes {
            self.store_symbol(
                file_id,
                &attribute.name.name,
                SymbolKind::ProjectionAttribute,
                &attribute.name.span,
                Some(symbol_id),
                attribute.data_type.as_deref(),
                None,
            )?;
        }
        
        // Index actions
        for action in &node.actions {
            self.store_symbol(
                file_id,
                &action.name.name,
                SymbolKind::ProjectionAction,
                &action.name.span,
                Some(symbol_id),
                None,
                None,
            )?;
        }
        
        Ok(())
    }
    
    fn index_marble_client_node<P: AsRef<Path>>(
        &mut self,
        file_id: i64,
        _file_path: P,
        node: &MarbleClientNode,
    ) -> Result<()> {
        let symbol_id = self.store_symbol(
            file_id,
            &node.name.name,
            SymbolKind::Client,
            &node.name.span,
            None,
            None,
            None,
        )?;
        
        // Index commands
        for command in &node.commands {
            self.store_symbol(
                file_id,
                &command.name.name,
                SymbolKind::ClientCommand,
                &command.name.span,
                Some(symbol_id),
                Some(&command.action),
                None,
            )?;
        }
        
        Ok(())
    }
    
    // Helper methods
    
    fn store_symbol(
        &mut self,
        file_id: i64,
        name: &str,
        kind: SymbolKind,
        span: &Span,
        parent_id: Option<i64>,
        signature: Option<&str>,
        documentation: Option<&str>,
    ) -> Result<i64> {
        let symbol_id = self.database.store_symbol(
            file_id,
            name,
            &kind.to_string(),
            span.start.line,
            span.start.column,
            span.end.line,
            span.end.column,
            span.start.offset,
            span.end.offset,
            parent_id,
            signature,
            documentation,
        )?;
        
        Ok(symbol_id)
    }
    
    fn store_reference(
        &mut self,
        _file_id: i64,
        _name: &str,
        _span: &Span,
        _kind: ReferenceKind,
    ) -> Result<()> {
        // For now, just store without linking to symbol_id
        // In a real implementation, we'd need to resolve the symbol first
        
        Ok(())
    }
    
    fn build_procedure_signature(&self, name: &Identifier, parameters: &[Parameter]) -> String {
        let param_strings: Vec<String> = parameters
            .iter()
            .map(|p| format!("{} {:?} {}", p.name.name, p.mode, p.param_type.name))
            .collect();
        
        format!("{}({})", name.name, param_strings.join(", "))
    }
    
    fn build_function_signature(&self, name: &Identifier, parameters: &[Parameter], return_type: &Type) -> String {
        let param_strings: Vec<String> = parameters
            .iter()
            .map(|p| format!("{} {:?} {}", p.name.name, p.mode, p.param_type.name))
            .collect();
        
        format!("{}({}) RETURN {}", name.name, param_strings.join(", "), return_type.name)
    }
}

// Conversion functions

impl From<SymbolRow> for SymbolInfo {
    fn from(row: SymbolRow) -> Self {
        Self {
            id: Some(row.id),
            name: row.name,
            kind: row.kind.parse().unwrap_or(SymbolKind::Variable),
            span: Span {
                start: Position {
                    line: row.start_line,
                    column: row.start_column,
                    offset: row.start_offset,
                },
                end: Position {
                    line: row.end_line,
                    column: row.end_column,
                    offset: row.end_offset,
                },
            },
            file_path: row.file_path,
            signature: row.signature,
            documentation: row.documentation,
            parent: None, // TODO: Resolve parent relationships
        }
    }
}

impl std::str::FromStr for SymbolKind {
    type Err = ();
    
    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s {
            "Package" => Ok(SymbolKind::Package),
            "Procedure" => Ok(SymbolKind::Procedure),
            "Function" => Ok(SymbolKind::Function),
            "Variable" => Ok(SymbolKind::Variable),
            "Parameter" => Ok(SymbolKind::Parameter),
            "Type" => Ok(SymbolKind::Type),
            "Constant" => Ok(SymbolKind::Constant),
            "Exception" => Ok(SymbolKind::Exception),
            "Cursor" => Ok(SymbolKind::Cursor),
            "Entity" => Ok(SymbolKind::Entity),
            "Entity Attribute" => Ok(SymbolKind::EntityAttribute),
            "Entity Key" => Ok(SymbolKind::EntityKey),
            "Enumeration" => Ok(SymbolKind::Enumeration),
            "Enumeration Value" => Ok(SymbolKind::EnumerationValue),
            "View" => Ok(SymbolKind::View),
            "View Column" => Ok(SymbolKind::ViewColumn),
            "Projection" => Ok(SymbolKind::Projection),
            "Projection Attribute" => Ok(SymbolKind::ProjectionAttribute),
            "Projection Action" => Ok(SymbolKind::ProjectionAction),
            "Client" => Ok(SymbolKind::Client),
            "Client Layout" => Ok(SymbolKind::ClientLayout),
            "Client Command" => Ok(SymbolKind::ClientCommand),
            _ => Err(()),
        }
    }
}

impl std::str::FromStr for ReferenceKind {
    type Err = ();
    
    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s {
            "Definition" => Ok(ReferenceKind::Definition),
            "Usage" => Ok(ReferenceKind::Usage),
            "Call" => Ok(ReferenceKind::Call),
            "Assignment" => Ok(ReferenceKind::Assignment),
            "Declaration" => Ok(ReferenceKind::Declaration),
            _ => Err(()),
        }
    }
}
