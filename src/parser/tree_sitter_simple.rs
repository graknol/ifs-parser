use tree_sitter::{Parser, Node};
use crate::parser::ast::*;
use anyhow::{anyhow, Result};

pub struct TreeSitterParser {
    parser: Parser,
}

impl TreeSitterParser {
    pub fn new() -> Result<Self> {
        let mut parser = Parser::new();
        let language = ifs_cloud_parser::language();
        parser.set_language(language)
            .map_err(|e| anyhow!("Failed to set language: {}", e))?;
        
        Ok(Self { parser })
    }

    pub fn parse(&mut self, source: &str) -> Result<AstNode> {
        let tree = self.parser.parse(source, None)
            .ok_or_else(|| anyhow!("Failed to parse source"))?;
        
        let root_node = tree.root_node();
        self.convert_node(&root_node, source)
    }

    fn convert_node(&self, node: &Node, source: &str) -> Result<AstNode> {
        match node.kind() {
            "source_file" => {
                // For a source file, try to find the first meaningful child
                for child in node.children(&mut node.walk()) {
                    if let Ok(ast_node) = self.convert_node(&child, source) {
                        return Ok(ast_node);
                    }
                }
                // If no specific nodes found, create a generic package
                self.create_default_package(node, source)
            }
            "package_declaration" | "package" => self.convert_package(node, source),
            "procedure_declaration" | "procedure" => self.convert_procedure(node, source),
            "function_declaration" | "function" => self.convert_function(node, source),
            "entity_declaration" | "entity" => self.convert_entity(node, source),
            _ => {
                // For unknown nodes, try to create a default structure
                self.create_default_package(node, source)
            }
        }
    }

    fn create_default_package(&self, node: &Node, _source: &str) -> Result<AstNode> {
        let span = self.node_to_span(node);
        let name = Identifier {
            name: "unnamed_package".to_string(),
            span: span.clone(),
        };

        Ok(AstNode::PlSql(PlSqlNode::Package {
            name,
            component: None,
            annotations: Vec::new(),
            declarations: Vec::new(),
            body: None,
            span,
        }))
    }

    fn convert_package(&self, node: &Node, source: &str) -> Result<AstNode> {
        let mut name = None;
        let component = None;
        let mut annotations = Vec::new();
        let declarations = Vec::new();
        let body = None;

        // Try to extract package name and other components
        for child in node.children(&mut node.walk()) {
            match child.kind() {
                "identifier" if name.is_none() => {
                    name = Some(Identifier {
                        name: self.node_text(&child, source)?,
                        span: self.node_to_span(&child),
                    });
                }
                "annotation" => {
                    if let Ok(ann) = self.convert_annotation(&child, source) {
                        annotations.push(ann);
                    }
                }
                _ => {}
            }
        }

        let name = name.unwrap_or_else(|| Identifier {
            name: "unnamed_package".to_string(),
            span: self.node_to_span(node),
        });
        
        Ok(AstNode::PlSql(PlSqlNode::Package {
            name,
            component,
            annotations,
            declarations,
            body,
            span: self.node_to_span(node),
        }))
    }

    fn convert_procedure(&self, node: &Node, source: &str) -> Result<AstNode> {
        let mut name = None;
        let mut annotations = Vec::new();
        let parameters = Vec::new(); // Simplified for now
        let body = Vec::new(); // Simplified for now

        for child in node.children(&mut node.walk()) {
            match child.kind() {
                "identifier" if name.is_none() => {
                    name = Some(Identifier {
                        name: self.node_text(&child, source)?,
                        span: self.node_to_span(&child),
                    });
                }
                "annotation" => {
                    if let Ok(ann) = self.convert_annotation(&child, source) {
                        annotations.push(ann);
                    }
                }
                _ => {}
            }
        }

        let name = name.unwrap_or_else(|| Identifier {
            name: "unnamed_procedure".to_string(),
            span: self.node_to_span(node),
        });

        let visibility = self.determine_visibility(&name.name);
        
        Ok(AstNode::PlSql(PlSqlNode::Procedure {
            name,
            visibility,
            annotations,
            parameters,
            body,
            span: self.node_to_span(node),
        }))
    }

    fn convert_function(&self, node: &Node, source: &str) -> Result<AstNode> {
        let mut name = None;
        let mut annotations = Vec::new();
        let parameters = Vec::new(); // Simplified for now
        let body = Vec::new(); // Simplified for now

        for child in node.children(&mut node.walk()) {
            match child.kind() {
                "identifier" if name.is_none() => {
                    name = Some(Identifier {
                        name: self.node_text(&child, source)?,
                        span: self.node_to_span(&child),
                    });
                }
                "annotation" => {
                    if let Ok(ann) = self.convert_annotation(&child, source) {
                        annotations.push(ann);
                    }
                }
                _ => {}
            }
        }

        let name = name.unwrap_or_else(|| Identifier {
            name: "unnamed_function".to_string(),
            span: self.node_to_span(node),
        });

        let visibility = self.determine_visibility(&name.name);

        // Create a default return type
        let return_type = Type {
            name: "VARCHAR2".to_string(),
            parameters: Vec::new(),
            span: self.node_to_span(node),
        };
        
        Ok(AstNode::PlSql(PlSqlNode::Function {
            name,
            visibility,
            annotations,
            parameters,
            return_type,
            body,
            span: self.node_to_span(node),
        }))
    }

    fn convert_entity(&self, node: &Node, _source: &str) -> Result<AstNode> {
        let name = Identifier {
            name: "entity".to_string(),
            span: self.node_to_span(node),
        };

        Ok(AstNode::Entity(EntityNode {
            entity_name: name,
            component: "unknown".to_string(),
            code_gen_properties: None,
            attributes: Vec::new(),
            keys: Vec::new(),
            references: Vec::new(),
            state_machine: None,
            span: self.node_to_span(node),
        }))
    }

    fn convert_annotation(&self, node: &Node, source: &str) -> Result<IfsAnnotation> {
        let text = self.node_text(node, source)?;
        match text.as_str() {
            "@Override" => Ok(IfsAnnotation::Override),
            "@Overtake" => Ok(IfsAnnotation::Overtake),
            "@UncheckedAccess" => Ok(IfsAnnotation::UncheckedAccess),
            _ => Err(anyhow!("Unknown annotation: {}", text))
        }
    }

    fn determine_visibility(&self, name: &str) -> ProcedureVisibility {
        if name.ends_with("___") {
            ProcedureVisibility::Private
        } else if name.ends_with("__") {
            ProcedureVisibility::Protected
        } else {
            ProcedureVisibility::Public
        }
    }

    fn node_text(&self, node: &Node, source: &str) -> Result<String> {
        node.utf8_text(source.as_bytes())
            .map(|s| s.to_string())
            .map_err(|e| anyhow!("Invalid UTF-8: {}", e))
    }

    fn node_to_span(&self, node: &Node) -> Span {
        Span {
            start: Position {
                line: node.start_position().row + 1,
                column: node.start_position().column + 1,
                offset: node.start_byte(),
            },
            end: Position {
                line: node.end_position().row + 1,
                column: node.end_position().column + 1,
                offset: node.end_byte(),
            },
        }
    }
}

pub struct IfsPlsqlParser {
    tree_sitter: TreeSitterParser,
}

impl IfsPlsqlParser {
    pub fn new() -> Result<Self> {
        Ok(Self {
            tree_sitter: TreeSitterParser::new()?,
        })
    }

    pub fn parse(&mut self, input: &str) -> Result<AstNode> {
        self.tree_sitter.parse(input)
    }
}
