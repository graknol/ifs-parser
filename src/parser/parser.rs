// Parser implementation for all supported languages
//
// This module implements parsers for:
// - PL/SQL variant
// - XML entities and enumerations  
// - SQL variant
// - Marble DSL

use crate::parser::{ast::*, lexer::*, Language};
use crate::Result;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ParseError {
    #[error("Unexpected token: expected {expected}, found {found}")]
    UnexpectedToken { expected: String, found: String },
    
    #[error("Unexpected end of input")]
    UnexpectedEof,
    
    #[error("Invalid syntax: {message}")]
    InvalidSyntax { message: String },
    
    #[error("Unsupported language: {language:?}")]
    UnsupportedLanguage { language: Language },
}

/// Parser state for tracking current position and tokens
pub struct Parser {
    tokens: Vec<Token>,
    current: usize,
    language: Language,
}

impl Parser {
    /// Create a new parser for the given tokens and language
    pub fn new(tokens: Vec<Token>, language: Language) -> Self {
        let mut parser = Self {
            tokens,
            current: 0,
            language,
        };
        // Skip any initial whitespace
        parser.skip_whitespace();
        parser
    }
    
    /// Parse the tokens into an AST
    pub fn parse(&mut self) -> Result<AstNode> {
        match self.language {
            Language::PlSql => Ok(AstNode::PlSql(self.parse_plsql()?)),
            Language::Entity => Ok(AstNode::Entity(self.parse_entity()?)),
            Language::Enumeration => Ok(AstNode::Enumeration(self.parse_enumeration()?)),
            Language::Views => Ok(AstNode::Views(self.parse_views()?)),
            Language::Storage => Ok(AstNode::Storage(self.parse_storage()?)),
            Language::MarbleProjection => Ok(AstNode::MarbleProjection(self.parse_marble_projection()?)),
            Language::MarbleClient => Ok(AstNode::MarbleClient(self.parse_marble_client()?)),
        }
    }
    
    /// Parse PL/SQL source code (IFS-style with direct procedure/function declarations)
    fn parse_plsql(&mut self) -> Result<PlSqlNode> {
        self.skip_whitespace();
        
        // For IFS Cloud, we expect direct function/procedure declarations, not packages
        if self.match_token(TokenType::Function) {
            self.parse_function()
        } else if self.match_token(TokenType::Procedure) {
            self.parse_procedure()
        } else if self.match_token(TokenType::Package) {
            // Still support legacy package format for compatibility
            self.parse_package()
        } else {
            Err(ParseError::InvalidSyntax {
                message: "Expected function or procedure declaration".to_string(),
            }.into())
        }
    }
    
    fn parse_package(&mut self) -> Result<PlSqlNode> {
        let start_pos = self.previous().position;
        let name = self.consume_identifier("Expected package name")?;
        
        // Accept either 'AS' or 'IS' after package name
        if !self.match_token(TokenType::As) && !self.match_token(TokenType::Is) {
            return Err(ParseError::UnexpectedToken {
                expected: "AS or IS".to_string(),
                found: format!("{:?}", self.peek().token_type),
            }.into());
        }
        
        let declarations = Vec::new();
        let mut body = None;
        
        // Parse declarations until we hit END or BODY
        while !self.check(TokenType::End) && !self.check(TokenType::Body) && !self.is_at_end() {
            self.skip_whitespace();
            if self.check(TokenType::Procedure) || self.check(TokenType::Function) {
                // For now, skip procedure/function declarations in package spec
                self.advance();
                self.skip_until_semicolon();
            } else {
                self.skip_until_semicolon();
            }
        }
        
        if self.match_token(TokenType::Body) {
            // Parse package body (simplified)
            while !self.check(TokenType::End) && !self.is_at_end() {
                self.skip_until_semicolon();
            }
            body = Some(Vec::new()); // Placeholder
        }
        
        self.consume(TokenType::End, "Expected 'END'")?;
        
        // Optional package name after END
        if self.check(TokenType::Identifier) {
            self.advance();
        }
        
        self.consume(TokenType::Semicolon, "Expected ';'")?;
        
        let end_pos = self.previous().position;
        
        Ok(PlSqlNode::Package {
            name,
            declarations,
            body,
            component: None, // Default no component
            annotations: Vec::new(),   // Default empty annotations
            span: Span {
                start: Position {
                    line: start_pos.line,
                    column: start_pos.column,
                    offset: start_pos.offset,
                },
                end: Position {
                    line: end_pos.line,
                    column: end_pos.column,
                    offset: end_pos.offset,
                },
            },
        })
    }
    
    fn parse_procedure(&mut self) -> Result<PlSqlNode> {
        let start_pos = self.previous().position;
        let name = self.consume_identifier("Expected procedure name")?;
        
        let parameters = Vec::new();
        if self.match_token(TokenType::LeftParen) {
            if !self.check(TokenType::RightParen) {
                // Parse parameters (simplified)
                loop {
                    self.skip_until_comma_or_paren();
                    if !self.match_token(TokenType::Comma) {
                        break;
                    }
                }
            }
            self.consume(TokenType::RightParen, "Expected ')'")?;
        }
        
        if self.match_token(TokenType::Identifier) {
            // Skip IS/AS
        }
        
        let body = Vec::new(); // Placeholder
        let end_pos = self.current_position();
        
        Ok(PlSqlNode::Procedure {
            name: name.clone(),
            parameters,
            body,
            visibility: self.determine_visibility(&name.name),
            annotations: Vec::new(),           // Default empty annotations
            span: Span {
                start: Position {
                    line: start_pos.line,
                    column: start_pos.column,
                    offset: start_pos.offset,
                },
                end: Position {
                    line: end_pos.line,
                    column: end_pos.column,
                    offset: end_pos.offset,
                },
            },
        })
    }
    
    fn parse_function(&mut self) -> Result<PlSqlNode> {
        let start_pos = self.previous().position;
        let name = self.consume_identifier("Expected function name")?;
        
        let parameters = Vec::new(); // Placeholder
        let return_type = Type {
            name: "VARCHAR2".to_string(),
            parameters: Vec::new(),
            span: Span {
                start: Position { line: 1, column: 1, offset: 0 },
                end: Position { line: 1, column: 1, offset: 0 },
            },
        }; // Placeholder
        let body = Vec::new(); // Placeholder
        let end_pos = self.current_position();
        
        Ok(PlSqlNode::Function {
            name: name.clone(),
            parameters,
            return_type,
            body,
            visibility: self.determine_visibility(&name.name),
            annotations: Vec::new(),           // Default empty annotations
            span: Span {
                start: Position {
                    line: start_pos.line,
                    column: start_pos.column,
                    offset: start_pos.offset,
                },
                end: Position {
                    line: end_pos.line,
                    column: end_pos.column,
                    offset: end_pos.offset,
                },
            },
        })
    }
    
    #[allow(dead_code)]
    fn parse_xml_entity(&mut self) -> Result<EntityNode> {
        // Placeholder implementation
        Ok(EntityNode {
            entity_name: Identifier {
                name: "placeholder".to_string(),
                span: self.current_span(),
            },
            component: "".to_string(),
            code_gen_properties: None,
            attributes: Vec::new(),
            keys: Vec::new(),
            references: Vec::new(),
            state_machine: None,
            span: self.current_span(),
        })
    }

    fn parse_entity(&mut self) -> Result<EntityNode> {
        // Parse entity definition - placeholder implementation
        Ok(EntityNode {
            entity_name: Identifier {
                name: "placeholder_entity".to_string(),
                span: self.current_span(),
            },
            component: "".to_string(),
            code_gen_properties: None,
            attributes: Vec::new(),
            keys: Vec::new(),
            references: Vec::new(),
            state_machine: None,
            span: self.current_span(),
        })
    }

    fn parse_enumeration(&mut self) -> Result<EnumerationNode> {
        // Parse enumeration definition - placeholder implementation
        Ok(EnumerationNode {
            enumeration_name: Identifier {
                name: "placeholder_enum".to_string(),
                span: self.current_span(),
            },
            component: "".to_string(),
            values: Vec::new(),
            span: self.current_span(),
        })
    }

    fn parse_views(&mut self) -> Result<ViewsNode> {
        // Parse views definition - placeholder implementation
        Ok(ViewsNode {
            layer: None,
            column_definitions: Vec::new(),
            views: Vec::new(),
            span: self.current_span(),
        })
    }

    fn parse_storage(&mut self) -> Result<StorageNode> {
        // Parse storage definition - placeholder implementation
        Ok(StorageNode {
            layer: None,
            definitions: Vec::new(),
            span: self.current_span(),
        })
    }
    
    #[allow(dead_code)]
    fn parse_xml_enumeration(&mut self) -> Result<EnumerationNode> {
        // Placeholder implementation - this method is deprecated
        // Use parse_enumeration instead
        Ok(EnumerationNode {
            enumeration_name: Identifier {
                name: "placeholder_enum".to_string(),
                span: self.current_span(),
            },
            component: "".to_string(),
            values: Vec::new(),
            span: self.current_span(),
        })
    }
    
    #[allow(dead_code)]
    fn parse_sql_view(&mut self) -> Result<ViewsNode> {
        // Placeholder implementation - this method is deprecated
        // Use parse_views instead
        Ok(ViewsNode {
            layer: None,
            column_definitions: Vec::new(),
            views: Vec::new(),
            span: self.current_span(),
        })
    }
    
    fn parse_marble_projection(&mut self) -> Result<MarbleProjectionNode> {
        // Placeholder implementation
        Ok(MarbleProjectionNode {
            name: Identifier {
                name: "placeholder".to_string(),
                span: self.current_span(),
            },
            entity: Identifier {
                name: "placeholder".to_string(),
                span: self.current_span(),
            },
            attributes: Vec::new(),
            actions: Vec::new(),
            span: self.current_span(),
        })
    }
    
    fn parse_marble_client(&mut self) -> Result<MarbleClientNode> {
        // Placeholder implementation
        Ok(MarbleClientNode {
            name: Identifier {
                name: "placeholder".to_string(),
                span: self.current_span(),
            },
            layout: Vec::new(),
            commands: Vec::new(),
            span: self.current_span(),
        })
    }
    
    // Helper methods
    
    fn advance(&mut self) -> &Token {
        // Store the token we want to return before skipping whitespace
        let token_index = if !self.is_at_end() {
            let current_index = self.current;
            self.current += 1;
            current_index
        } else {
            return &self.tokens[self.tokens.len() - 1]; // Return EOF
        };
        
        // Skip whitespace after advancing
        while self.current < self.tokens.len() {
            match self.tokens[self.current].token_type {
                TokenType::Whitespace | TokenType::Newline | TokenType::Comment => {
                    self.current += 1;
                }
                _ => break,
            }
        }
        
        // Return the actual token we advanced over, not the whitespace
        &self.tokens[token_index]
    }
    
    fn is_at_end(&self) -> bool {
        self.peek_non_whitespace().token_type == TokenType::Eof
    }
    
    fn peek(&self) -> &Token {
        &self.tokens[self.current]
    }
    
    /// Peek at the next non-whitespace token
    fn peek_non_whitespace(&self) -> &Token {
        let mut pos = self.current;
        while pos < self.tokens.len() {
            match self.tokens[pos].token_type {
                TokenType::Whitespace | TokenType::Newline | TokenType::Comment => {
                    pos += 1;
                }
                _ => break,
            }
        }
        if pos >= self.tokens.len() {
            &self.tokens[self.tokens.len() - 1] // Should be EOF
        } else {
            &self.tokens[pos]
        }
    }
    
    fn previous(&self) -> &Token {
        &self.tokens[self.current.saturating_sub(1)]
    }
    
    fn check(&self, token_type: TokenType) -> bool {
        if self.is_at_end() {
            false
        } else {
            self.peek_non_whitespace().token_type == token_type
        }
    }
    
    fn match_token(&mut self, token_type: TokenType) -> bool {
        if self.check(token_type) {
            self.advance();
            true
        } else {
            false
        }
    }
    
    fn consume(&mut self, token_type: TokenType, _message: &str) -> Result<&Token> {
        if self.check(token_type.clone()) {
            Ok(self.advance())
        } else {
            Err(ParseError::UnexpectedToken {
                expected: format!("{:?}", token_type),
                found: format!("{:?}", self.peek().token_type),
            }.into())
        }
    }
    
    fn consume_identifier(&mut self, _message: &str) -> Result<Identifier> {
        if self.check(TokenType::Identifier) {
            let token = self.advance();
            Ok(Identifier {
                name: token.value.clone(),
                span: Span {
                    start: Position {
                        line: token.position.line,
                        column: token.position.column,
                        offset: token.position.offset,
                    },
                    end: Position {
                        line: token.position.line,
                        column: token.position.column + token.value.len(),
                        offset: token.position.offset + token.value.len(),
                    },
                },
            })
        } else {
            Err(ParseError::UnexpectedToken {
                expected: "identifier".to_string(),
                found: format!("{:?}", self.peek().token_type),
            }.into())
        }
    }
    
    fn skip_whitespace(&mut self) {
        while !self.is_at_end() {
            match self.peek().token_type {
                TokenType::Whitespace | TokenType::Newline | TokenType::Comment => {
                    self.current += 1;
                }
                _ => break,
            }
        }
    }
    
    fn skip_until_semicolon(&mut self) {
        while !self.check(TokenType::Semicolon) && !self.is_at_end() {
            self.advance();
        }
        if self.check(TokenType::Semicolon) {
            self.advance();
        }
    }
    
    fn skip_until_comma_or_paren(&mut self) {
        while !self.check(TokenType::Comma) && !self.check(TokenType::RightParen) && !self.is_at_end() {
            self.advance();
        }
    }
    
    fn current_position(&self) -> Position {
        let token = self.peek();
        Position {
            line: token.position.line,
            column: token.position.column,
            offset: token.position.offset,
        }
    }
    
    fn current_span(&self) -> Span {
        let pos = self.current_position();
        Span {
            start: pos.clone(),
            end: pos,
        }
    }
    
    /// Determine procedure/function visibility based on IFS naming convention
    fn determine_visibility(&self, name: &str) -> ProcedureVisibility {
        if name.ends_with("___") {
            ProcedureVisibility::Private
        } else if name.ends_with("__") {
            ProcedureVisibility::Protected
        } else {
            ProcedureVisibility::Public
        }
    }
}

/// Convenience function to parse source code
pub fn parse_source(input: &str, language: Language) -> Result<AstNode> {
    let mut lexer = Lexer::new(input.to_string(), language);
    let tokens = lexer.tokenize();
    let mut parser = Parser::new(tokens, language);
    parser.parse()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_package() {
        let input = "PACKAGE test_pkg IS END;";
        let result = parse_source(input, Language::PlSql);
        
        assert!(result.is_ok());
        if let AstNode::PlSql(PlSqlNode::Package { name, .. }) = result.unwrap() {
            assert_eq!(name.name, "test_pkg");
        } else {
            panic!("Expected package node");
        }
    }
    
    #[test]
    fn test_parse_procedure() {
        let input = "PROCEDURE test_proc IS BEGIN NULL; END;";
        let result = parse_source(input, Language::PlSql);
        
        assert!(result.is_ok());
        if let AstNode::PlSql(PlSqlNode::Procedure { name, .. }) = result.unwrap() {
            assert_eq!(name.name, "test_proc");
        } else {
            panic!("Expected procedure node");
        }
    }
}
