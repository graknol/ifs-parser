// Tree-sitter integration for IFS PL/SQL parsing

use tree_sitter::{Language, Parser, Tree, Node};
use ifs_cloud_parser::language;
use crate::parser::ast::*;
use anyhow::{Result, anyhow};
use std::collections::HashMap;
use std::ops::Range;

/// Tree-sitter based parser for IFS PL/SQL
pub struct TreeSitterParser {
    parser: Parser,
    current_tree: Option<Tree>,
}

impl TreeSitterParser {
    pub fn new() -> Result<Self> {
        let mut parser = Parser::new();
        parser.set_language(language())
            .map_err(|e| anyhow!("Failed to set language: {}", e))?;

        Ok(Self {
            parser,
            current_tree: None,
        })
    }

    /// Parse source text and return tree-sitter tree
    pub fn parse(&mut self, source: &str) -> Result<Tree> {
        let tree = self.parser
            .parse(source, self.current_tree.as_ref())
            .ok_or_else(|| anyhow!("Tree-sitter parsing failed"))?;
        
        self.current_tree = Some(tree.clone());
        Ok(tree)
    }

    /// Parse incrementally with old tree for minimal reparsing
    pub fn parse_incremental(&mut self, source: &str) -> Result<Tree> {
        // Tree-sitter automatically handles incremental parsing when old tree is provided
        self.parse(source)
    }

    /// Convert tree-sitter tree to our AST
    pub fn tree_to_ast(&self, tree: &Tree, source: &str) -> Result<AstNode> {
        let root = tree.root_node();
        self.convert_node(root, source)
    }

    /// Convert a tree-sitter node to our AST node
    fn convert_node(&self, node: Node, source: &str) -> Result<AstNode> {
        let kind = node.kind();
        let start = node.start_byte();
        let end = node.end_byte();
        let text = &source[start..end];

        match kind {
            "source_file" => {
                let mut children = Vec::new();
                for child in node.children(&mut node.walk()) {
                    if !child.is_error() {
                        children.push(self.convert_node(child, source)?);
                    }
                }
                Ok(AstNode::SourceFile { children })
            }
            
            "function_declaration" => {
                let mut name = String::new();
                let mut parameters = Vec::new();
                let mut return_type = None;
                let mut body = Vec::new();
                let mut annotations = Vec::new();

                for child in node.children(&mut node.walk()) {
                    match child.kind() {
                        "annotation" => {
                            annotations.push(self.convert_annotation(child, source)?);
                        }
                        "identifier" => {
                            if name.is_empty() {
                                name = child.utf8_text(source.as_bytes())
                                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?
                                    .to_string();
                            }
                        }
                        "parameter_list" => {
                            parameters = self.convert_parameter_list(child, source)?;
                        }
                        "type_name" => {
                            return_type = Some(self.convert_type_name(child, source)?);
                        }
                        _ => {
                            // Add other child types to body
                            body.push(self.convert_node(child, source)?);
                        }
                    }
                }

                Ok(AstNode::Function {
                    name,
                    parameters,
                    return_type,
                    body,
                    annotations,
                })
            }

            "procedure_declaration" => {
                let mut name = String::new();
                let mut parameters = Vec::new();
                let mut body = Vec::new();
                let mut annotations = Vec::new();

                for child in node.children(&mut node.walk()) {
                    match child.kind() {
                        "annotation" => {
                            annotations.push(self.convert_annotation(child, source)?);
                        }
                        "identifier" => {
                            if name.is_empty() {
                                name = child.utf8_text(source.as_bytes())
                                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?
                                    .to_string();
                            }
                        }
                        "parameter_list" => {
                            parameters = self.convert_parameter_list(child, source)?;
                        }
                        _ => {
                            body.push(self.convert_node(child, source)?);
                        }
                    }
                }

                Ok(AstNode::Procedure {
                    name,
                    parameters,
                    body,
                    annotations,
                })
            }

            "variable_declaration" => {
                let mut name = String::new();
                let mut var_type = None;
                let mut is_constant = false;
                let mut initial_value = None;

                for child in node.children(&mut node.walk()) {
                    match child.kind() {
                        "identifier" => {
                            name = child.utf8_text(source.as_bytes())
                                .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?
                                .to_string();
                        }
                        "type_name" => {
                            var_type = Some(self.convert_type_name(child, source)?);
                        }
                        "CONSTANT" => {
                            is_constant = true;
                        }
                        _ => {}
                    }
                }

                Ok(AstNode::Variable {
                    name,
                    var_type: var_type.unwrap_or_else(|| Type::Unknown),
                    is_constant,
                    initial_value,
                })
            }

            "assignment_statement" => {
                let mut target = None;
                let mut value = None;

                for child in node.children(&mut node.walk()) {
                    match child.kind() {
                        "identifier" | "qualified_identifier" => {
                            if target.is_none() {
                                target = Some(child.utf8_text(source.as_bytes())
                                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?
                                    .to_string());
                            }
                        }
                        _ => {
                            if child.is_named() && value.is_none() {
                                value = Some(Box::new(self.convert_node(child, source)?));
                            }
                        }
                    }
                }

                Ok(AstNode::Assignment {
                    target: target.unwrap_or_default(),
                    value: value.unwrap_or_else(|| Box::new(AstNode::Literal(LiteralValue::Null))),
                })
            }

            "if_statement" => {
                let mut condition = None;
                let mut then_branch = Vec::new();
                let mut else_branch = Vec::new();

                for child in node.children(&mut node.walk()) {
                    match child.kind() {
                        "parenthesized_expression" | "null_check_expression" | "binary_expression" => {
                            if condition.is_none() {
                                condition = Some(Box::new(self.convert_node(child, source)?));
                            }
                        }
                        "return_statement" | "assignment_statement" => {
                            then_branch.push(self.convert_node(child, source)?);
                        }
                        _ => {}
                    }
                }

                Ok(AstNode::IfStatement {
                    condition: condition.unwrap_or_else(|| Box::new(AstNode::Literal(LiteralValue::Boolean(false)))),
                    then_branch,
                    else_branch,
                })
            }

            "return_statement" => {
                let mut value = None;
                
                for child in node.children(&mut node.walk()) {
                    if child.is_named() && child.kind() != "RETURN" {
                        value = Some(Box::new(self.convert_node(child, source)?));
                        break;
                    }
                }

                Ok(AstNode::Return { value })
            }

            "number" => {
                let text = node.utf8_text(source.as_bytes())
                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
                let value = text.parse::<f64>()
                    .map_err(|_| anyhow!("Invalid number: {}", text))?;
                Ok(AstNode::Literal(LiteralValue::Number(value)))
            }

            "string_literal" => {
                let text = node.utf8_text(source.as_bytes())
                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
                // Remove quotes
                let content = if text.len() >= 2 {
                    &text[1..text.len()-1]
                } else {
                    text
                };
                Ok(AstNode::Literal(LiteralValue::String(content.to_string())))
            }

            "boolean_literal" => {
                let text = node.utf8_text(source.as_bytes())
                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
                let value = text.eq_ignore_ascii_case("true");
                Ok(AstNode::Literal(LiteralValue::Boolean(value)))
            }

            "identifier" | "qualified_identifier" => {
                let text = node.utf8_text(source.as_bytes())
                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
                Ok(AstNode::Identifier(text.to_string()))
            }

            "comment" => {
                let text = node.utf8_text(source.as_bytes())
                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
                Ok(AstNode::Comment(text.to_string()))
            }

            _ => {
                // For unknown node types, create a generic node with text
                let text = node.utf8_text(source.as_bytes())
                    .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
                Ok(AstNode::Unknown {
                    kind: kind.to_string(),
                    text: text.to_string(),
                })
            }
        }
    }

    fn convert_annotation(&self, node: Node, source: &str) -> Result<Annotation> {
        let text = node.utf8_text(source.as_bytes())
            .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
        
        match text {
            "@Override" => Ok(Annotation::Override),
            "@Overtake" => Ok(Annotation::Overtake { params: vec![] }),
            _ => Ok(Annotation::Unknown(text.to_string())),
        }
    }

    fn convert_parameter_list(&self, node: Node, source: &str) -> Result<Vec<Parameter>> {
        let mut parameters = Vec::new();
        
        for child in node.children(&mut node.walk()) {
            if child.kind() == "parameter" {
                let param = self.convert_parameter(child, source)?;
                parameters.push(param);
            }
        }
        
        Ok(parameters)
    }

    fn convert_parameter(&self, node: Node, source: &str) -> Result<Parameter> {
        let mut name = String::new();
        let mut param_type = Type::Unknown;
        let mut mode = ParameterMode::In;

        for child in node.children(&mut node.walk()) {
            match child.kind() {
                "identifier" => {
                    name = child.utf8_text(source.as_bytes())
                        .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?
                        .to_string();
                }
                "parameter_mode" => {
                    let mode_text = child.utf8_text(source.as_bytes())
                        .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
                    mode = match mode_text {
                        "IN" => ParameterMode::In,
                        "OUT" => ParameterMode::Out,
                        "IN OUT" => ParameterMode::InOut,
                        _ => ParameterMode::In,
                    };
                }
                "type_name" => {
                    param_type = self.convert_type_name(child, source)?;
                }
                _ => {}
            }
        }

        Ok(Parameter {
            name,
            param_type,
            mode,
            default_value: None,
        })
    }

    fn convert_type_name(&self, node: Node, source: &str) -> Result<Type> {
        let text = node.utf8_text(source.as_bytes())
            .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
            
        if text.contains("%TYPE") || text.contains("%ROWTYPE") {
            Ok(Type::Reference(text.to_string()))
        } else {
            match text {
                "VARCHAR2" | "CLOB" => Ok(Type::String),
                "NUMBER" => Ok(Type::Number),
                "DATE" => Ok(Type::Date),
                "BOOLEAN" => Ok(Type::Boolean),
                _ => Ok(Type::Custom(text.to_string())),
            }
        }
    }
}

/// High-level parsing interface using tree-sitter
pub struct IfsParser {
    ts_parser: TreeSitterParser,
}

impl IfsParser {
    pub fn new() -> Result<Self> {
        Ok(Self {
            ts_parser: TreeSitterParser::new()?,
        })
    }

    /// Parse IFS PL/SQL source code
    pub fn parse(&mut self, source: &str) -> Result<AstNode> {
        let tree = self.ts_parser.parse(source)?;
        self.ts_parser.tree_to_ast(&tree, source)
    }

    /// Parse incrementally for better performance
    pub fn parse_incremental(&mut self, source: &str) -> Result<AstNode> {
        let tree = self.ts_parser.parse_incremental(source)?;
        self.ts_parser.tree_to_ast(&tree, source)
    }
}
