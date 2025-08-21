// Abstract Syntax Tree definitions for all supported languages
//
// This module defines the AST nodes for:
// - PL/SQL variant
// - XML entities and enumerations  
// - SQL variant
// - Marble DSL

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Position information for source code elements
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Position {
    pub line: usize,
    pub column: usize,
    pub offset: usize,
}

/// Span information covering a range in source code
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Span {
    pub start: Position,
    pub end: Position,
}

/// Identifier with position information
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Identifier {
    pub name: String,
    pub span: Span,
}

/// Root AST node that can contain any supported language
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum AstNode {
    PlSql(PlSqlNode),
    Entity(EntityNode),
    Enumeration(EnumerationNode),
    Views(ViewsNode),
    Storage(StorageNode),
    MarbleProjection(MarbleProjectionNode),
    MarbleClient(MarbleClientNode),
}

// PL/SQL AST nodes with IFS-specific features
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PlSqlNode {
    Package {
        name: Identifier,
        component: Option<String>,
        annotations: Vec<IfsAnnotation>,
        declarations: Vec<PlSqlDeclaration>,
        body: Option<Vec<PlSqlStatement>>,
        span: Span,
    },
    Procedure {
        name: Identifier,
        visibility: ProcedureVisibility,
        annotations: Vec<IfsAnnotation>,
        parameters: Vec<Parameter>,
        body: Vec<PlSqlStatement>,
        span: Span,
    },
    Function {
        name: Identifier,
        visibility: ProcedureVisibility,
        annotations: Vec<IfsAnnotation>,
        parameters: Vec<Parameter>,
        return_type: Type,
        body: Vec<PlSqlStatement>,
        span: Span,
    },
}

/// IFS-specific annotations for procedures and functions
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum IfsAnnotation {
    Override,
    Overtake,
    UncheckedAccess,
}

/// Procedure/Function visibility based on naming convention
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ProcedureVisibility {
    Public,     // No trailing underscores
    Protected,  // Ends with __
    Private,    // Ends with ___
}

/// Overtake directives for procedure modifications
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum OvertakeDirective {
    Search {
        code: String,
        span: Span,
    },
    Replace {
        code: String,
        span: Span,
    },
    Append {
        code: String,
        span: Span,
    },
    Prepend {
        code: String,
        span: Span,
    },
    TextSearch {
        text: String,
        span: Span,
    },
    TextReplace {
        text: String,
        span: Span,
    },
    TextAppend {
        text: String,
        span: Span,
    },
    TextPrepend {
        text: String,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PlSqlDeclaration {
    Variable {
        name: Identifier,
        type_name: Type,
        default_value: Option<Expression>,
        span: Span,
    },
    Cursor {
        name: Identifier,
        query: String,
        span: Span,
    },
    Exception {
        name: Identifier,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PlSqlStatement {
    Assignment {
        target: Identifier,
        value: Expression,
        span: Span,
    },
    If {
        condition: Expression,
        then_branch: Vec<PlSqlStatement>,
        else_branch: Option<Vec<PlSqlStatement>>,
        span: Span,
    },
    Loop {
        body: Vec<PlSqlStatement>,
        span: Span,
    },
    Return {
        value: Option<Expression>,
        span: Span,
    },
    Call {
        name: Identifier,
        arguments: Vec<Expression>,
        span: Span,
    },
}

// Entity AST nodes (IFS text representation)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EntityNode {
    pub entity_name: Identifier,
    pub component: String,
    pub code_gen_properties: Option<CodeGenProperties>,
    pub attributes: Vec<EntityAttribute>,
    pub keys: Vec<EntityKey>,
    pub references: Vec<EntityReference>,
    pub state_machine: Option<StateMachine>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CodeGenProperties {
    pub properties: HashMap<String, String>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EntityAttribute {
    pub visibility: AttributeVisibility,
    pub name: Identifier,
    pub data_type: String,
    pub flags: String, // e.g., "AMI-L", "A-IUL"
    pub properties: HashMap<String, String>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum AttributeVisibility {
    Public,
    Private,
    Key,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EntityKey {
    pub name: Identifier,
    pub columns: Vec<Identifier>,
    pub is_primary: bool,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EntityReference {
    pub name: Identifier,
    pub referenced_entity: Identifier,
    pub foreign_key_columns: Vec<Identifier>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StateMachine {
    pub states: Vec<State>,
    pub transitions: Vec<StateTransition>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct State {
    pub name: Identifier,
    pub state_type: StateType,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum StateType {
    Initial,
    Normal,
    Final,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StateTransition {
    pub from_state: Identifier,
    pub to_state: Identifier,
    pub event: Option<String>,
    pub span: Span,
}

// Enumeration AST nodes (IFS text representation)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EnumerationNode {
    pub enumeration_name: Identifier,
    pub component: String,
    pub values: Vec<EnumerationValue>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EnumerationValue {
    pub name: Identifier,
    pub client_value: Option<String>,
    pub properties: HashMap<String, String>,
    pub span: Span,
}

// Views AST nodes (IFS custom SQL format)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ViewsNode {
    pub layer: Option<String>,
    pub column_definitions: Vec<ColumnDefinition>,
    pub views: Vec<ViewDefinition>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ColumnDefinition {
    pub name: Identifier,
    pub flags: Option<String>,
    pub datatype: Option<String>,
    pub prompt: Option<String>,
    pub reference: Option<String>,
    pub properties: HashMap<String, String>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ViewDefinition {
    pub name: Identifier,
    pub annotations: Vec<IfsAnnotation>,
    pub columns: Vec<ColumnDefinition>,
    pub query: SqlQuery,
    pub span: Span,
}

// Storage AST nodes (INDEX, SEQUENCE, TABLE definitions)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StorageNode {
    pub layer: Option<String>,
    pub definitions: Vec<StorageDefinition>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum StorageDefinition {
    Index {
        name: Identifier,
        is_unique: bool,
        table_name: Identifier,
        columns: Vec<Identifier>,
        span: Span,
    },
    Sequence {
        name: Identifier,
        properties: HashMap<String, String>,
        span: Span,
    },
    Table {
        name: Identifier,
        columns: Vec<TableColumn>,
        constraints: Vec<TableConstraint>,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TableColumn {
    pub name: Identifier,
    pub data_type: String,
    pub nullable: bool,
    pub default_value: Option<String>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum TableConstraint {
    PrimaryKey {
        name: Identifier,
        columns: Vec<Identifier>,
        span: Span,
    },
    UniqueConstraint {
        name: Identifier,
        columns: Vec<Identifier>,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SqlQuery {
    pub select: Vec<SelectItem>,
    pub from: Vec<FromItem>,
    pub where_clause: Option<Expression>,
    pub group_by: Vec<Expression>,
    pub having: Option<Expression>,
    pub order_by: Vec<OrderByItem>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SelectItem {
    pub expression: Expression,
    pub alias: Option<Identifier>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FromItem {
    pub table: Identifier,
    pub alias: Option<Identifier>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct OrderByItem {
    pub expression: Expression,
    pub direction: OrderDirection,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum OrderDirection {
    Asc,
    Desc,
}

// Marble DSL AST nodes
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MarbleProjectionNode {
    pub name: Identifier,
    pub entity: Identifier,
    pub attributes: Vec<ProjectionAttribute>,
    pub actions: Vec<ProjectionAction>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProjectionAttribute {
    pub name: Identifier,
    pub source: Option<Identifier>,
    pub data_type: Option<String>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ProjectionAction {
    pub name: Identifier,
    pub parameters: Vec<Parameter>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MarbleClientNode {
    pub name: Identifier,
    pub layout: Vec<LayoutElement>,
    pub commands: Vec<ClientCommand>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum LayoutElement {
    Group {
        name: Identifier,
        elements: Vec<LayoutElement>,
        span: Span,
    },
    Field {
        name: Identifier,
        binding: Identifier,
        span: Span,
    },
    List {
        name: Identifier,
        source: Identifier,
        columns: Vec<Identifier>,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ClientCommand {
    pub name: Identifier,
    pub action: String,
    pub parameters: HashMap<String, String>,
    pub span: Span,
}

// Common types
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Parameter {
    pub name: Identifier,
    pub param_type: Type,
    pub mode: ParameterMode,
    pub default_value: Option<Expression>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ParameterMode {
    In,
    Out,
    InOut,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Type {
    pub name: String,
    pub parameters: Vec<String>,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Expression {
    Identifier(Identifier),
    Literal {
        value: String,
        span: Span,
    },
    Binary {
        left: Box<Expression>,
        operator: BinaryOperator,
        right: Box<Expression>,
        span: Span,
    },
    Unary {
        operator: UnaryOperator,
        operand: Box<Expression>,
        span: Span,
    },
    FunctionCall {
        name: Identifier,
        arguments: Vec<Expression>,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum BinaryOperator {
    Add,
    Subtract,
    Multiply,
    Divide,
    Equal,
    NotEqual,
    LessThan,
    LessThanOrEqual,
    GreaterThan,
    GreaterThanOrEqual,
    And,
    Or,
    Like,
    In,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum UnaryOperator {
    Not,
    Minus,
    Plus,
}
