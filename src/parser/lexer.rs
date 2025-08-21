// Lexer module for tokenizing IFS Cloud source code
//
// This module provides tokenization for all supported languages

use crate::parser::Language;
use serde::{Deserialize, Serialize};
use std::fmt;

/// Position in source code
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TokenPosition {
    pub line: usize,
    pub column: usize,
    pub offset: usize,
}

/// A token with its type, value, and position
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Token {
    pub token_type: TokenType,
    pub value: String,
    pub position: TokenPosition,
}

/// Token types for all supported languages
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum TokenType {
    // Common tokens
    Identifier,
    Number,
    String,
    Comment,
    Whitespace,
    Newline,
    Eof,

    // Operators
    Plus,
    Minus,
    Multiply,
    Divide,
    Equal,
    NotEqual,
    LessThan,
    LessThanOrEqual,
    GreaterThan,
    GreaterThanOrEqual,
    Assignment,
    
    // Delimiters
    LeftParen,
    RightParen,
    LeftBrace,
    RightBrace,
    LeftBracket,
    RightBracket,
    Semicolon,
    Comma,
    Dot,
    Colon,
    
    // PL/SQL keywords
    Package,
    Body,
    Is,
    Procedure,
    Function,
    Begin,
    End,
    If,
    Then,
    Else,
    ElseIf,
    Loop,
    While,
    For,
    Return,
    Declare,
    Variable,
    Constant,
    Exception,
    Cursor,
    Type,
    Record,
    
    // SQL keywords
    Select,
    From,
    Where,
    GroupBy,
    Having,
    OrderBy,
    Union,
    Join,
    Inner,
    Left,
    Right,
    Full,
    On,
    As,
    Distinct,
    
    // XML tokens
    XmlOpen,
    XmlClose,
    XmlSelfClose,
    XmlText,
    XmlAttribute,
    
    // IFS-specific keywords and symbols
    Override,
    Overtake,
    UncheckedAccess,
    Super,
    Layer,
    Component,
    EntityName,
    EnumerationName,
    Attributes,
    Values,
    References,
    Keys,
    CodeGenProperties,
    
    // Entity visibility and flags
    Key,
    Public,
    Private,
    ClientValue,
    LabelText,
    
    // Views keywords
    Column,
    View,
    Flags,
    Datatype,
    Prompt,
    Ref,
    
    // Storage keywords
    Index,
    Unique,
    Sequence,
    Table,
    Primary,
    Constraint,
    
    // Overtake directives
    Search,
    Replace,
    Append,
    Prepend,
    TextSearch,
    TextReplace,
    TextAppend,
    TextPrepend,
    
    // Error token for unrecognized input
    Error,
}

impl fmt::Display for TokenType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TokenType::Identifier => write!(f, "identifier"),
            TokenType::Number => write!(f, "number"),
            TokenType::String => write!(f, "string"),
            TokenType::Comment => write!(f, "comment"),
            TokenType::Whitespace => write!(f, "whitespace"),
            TokenType::Newline => write!(f, "newline"),
            TokenType::Eof => write!(f, "end of file"),
            _ => write!(f, "{:?}", self),
        }
    }
}

/// Lexer for tokenizing source code
pub struct Lexer {
    input: String,
    position: usize,
    line: usize,
    column: usize,
    #[allow(dead_code)]
    language: Language,
}

impl Lexer {
    /// Create a new lexer for the given input and language
    pub fn new(input: String, language: Language) -> Self {
        Self {
            input,
            position: 0,
            line: 1,
            column: 1,
            language,
        }
    }
    
    /// Get the next token from the input
    pub fn next_token(&mut self) -> Token {
        if self.is_at_end() {
            return self.make_token(TokenType::Eof, "");
        }
        
        let start_position = self.current_position();
        let ch = self.advance();
        
        match ch {
            // Whitespace
            ' ' | '\t' | '\r' => {
                while self.peek().is_ascii_whitespace() && self.peek() != '\n' {
                    self.advance();
                }
                let value = &self.input[start_position.offset..self.position];
                self.make_token(TokenType::Whitespace, value)
            }
            '\n' => {
                self.line += 1;
                self.column = 1;
                self.make_token(TokenType::Newline, "\n")
            }
            
            // Single character tokens
            '(' => self.make_token(TokenType::LeftParen, "("),
            ')' => self.make_token(TokenType::RightParen, ")"),
            '{' => self.make_token(TokenType::LeftBrace, "{"),
            '}' => self.make_token(TokenType::RightBrace, "}"),
            '[' => self.make_token(TokenType::LeftBracket, "["),
            ']' => self.make_token(TokenType::RightBracket, "]"),
            ';' => self.make_token(TokenType::Semicolon, ";"),
            ',' => self.make_token(TokenType::Comma, ","),
            '.' => self.make_token(TokenType::Dot, "."),
            '+' => self.make_token(TokenType::Plus, "+"),
            '-' => {
                if self.peek() == '-' {
                    // Line comment
                    self.advance(); // consume second -
                    while self.peek() != '\n' && !self.is_at_end() {
                        self.advance();
                    }
                    let value = &self.input[start_position.offset..self.position];
                    self.make_token(TokenType::Comment, value)
                } else {
                    self.make_token(TokenType::Minus, "-")
                }
            }
            '*' => self.make_token(TokenType::Multiply, "*"),
            '/' => {
                if self.peek() == '*' {
                    // Block comment
                    self.advance(); // consume *
                    while !self.is_at_end() {
                        if self.peek() == '*' && self.peek_next() == '/' {
                            self.advance(); // consume *
                            self.advance(); // consume /
                            break;
                        }
                        if self.advance() == '\n' {
                            self.line += 1;
                            self.column = 1;
                        }
                    }
                    let value = &self.input[start_position.offset..self.position];
                    self.make_token(TokenType::Comment, value)
                } else {
                    self.make_token(TokenType::Divide, "/")
                }
            }
            ':' => {
                if self.peek() == '=' {
                    self.advance();
                    self.make_token(TokenType::Assignment, ":=")
                } else {
                    self.make_token(TokenType::Colon, ":")
                }
            }
            '=' => self.make_token(TokenType::Equal, "="),
            '<' => {
                if self.peek() == '=' {
                    self.advance();
                    self.make_token(TokenType::LessThanOrEqual, "<=")
                } else if self.peek() == '>' {
                    self.advance();
                    self.make_token(TokenType::NotEqual, "<>")
                } else {
                    self.make_token(TokenType::LessThan, "<")
                }
            }
            '>' => {
                if self.peek() == '=' {
                    self.advance();
                    self.make_token(TokenType::GreaterThanOrEqual, ">=")
                } else {
                    self.make_token(TokenType::GreaterThan, ">")
                }
            }
            
            // String literals
            '\'' => {
                while self.peek() != '\'' && !self.is_at_end() {
                    if self.advance() == '\n' {
                        self.line += 1;
                        self.column = 1;
                    }
                }
                
                if self.is_at_end() {
                    return self.make_token(TokenType::Error, "Unterminated string");
                }
                
                self.advance(); // consume closing '
                let value = &self.input[start_position.offset..self.position];
                self.make_token(TokenType::String, value)
            }
            
            // Numbers
            ch if ch.is_ascii_digit() => {
                while self.peek().is_ascii_digit() {
                    self.advance();
                }
                
                // Handle decimal numbers
                if self.peek() == '.' && self.peek_next().is_ascii_digit() {
                    self.advance(); // consume .
                    while self.peek().is_ascii_digit() {
                        self.advance();
                    }
                }
                
                let value = &self.input[start_position.offset..self.position];
                self.make_token(TokenType::Number, value)
            }
            
            // IFS annotations and special symbols
            '@' => {
                // Handle IFS annotations like @Override, @Overtake
                if self.peek().is_ascii_alphabetic() {
                    while self.peek().is_ascii_alphanumeric() {
                        self.advance();
                    }
                    let value = &self.input[start_position.offset..self.position];
                    let token_type = match value.to_lowercase().as_str() {
                        "@override" => TokenType::Override,
                        "@overtake" => TokenType::Overtake,
                        "@uncheckedaccess" => TokenType::UncheckedAccess,
                        _ => TokenType::Identifier,
                    };
                    self.make_token(token_type, value)
                } else {
                    self.make_token(TokenType::Error, "@")
                }
            }
            
            '$' => {
                // Handle overtake directives like $SEARCH, $REPLACE, etc.
                if self.peek().is_ascii_alphabetic() {
                    while self.peek().is_ascii_alphanumeric() {
                        self.advance();
                    }
                    let value = &self.input[start_position.offset..self.position];
                    let token_type = match value.to_uppercase().as_str() {
                        "$SEARCH" => TokenType::Search,
                        "$REPLACE" => TokenType::Replace,
                        "$APPEND" => TokenType::Append,
                        "$PREPEND" => TokenType::Prepend,
                        "$TEXTSEARCH" => TokenType::TextSearch,
                        "$TEXTREPLACE" => TokenType::TextReplace,
                        "$TEXTAPPEND" => TokenType::TextAppend,
                        "$TEXTPREPEND" => TokenType::TextPrepend,
                        "$END" => TokenType::End,
                        _ => TokenType::Identifier,
                    };
                    self.make_token(token_type, value)
                } else {
                    self.make_token(TokenType::Error, "$")
                }
            }
            
            // Identifiers and keywords
            ch if ch.is_ascii_alphabetic() || ch == '_' => {
                while self.peek().is_ascii_alphanumeric() || self.peek() == '_' {
                    self.advance();
                }
                
                let value = &self.input[start_position.offset..self.position];
                let token_type = self.keyword_or_identifier(value);
                self.make_token(token_type, value)
            }
            
            _ => self.make_token(TokenType::Error, &ch.to_string()),
        }
    }
    
    /// Tokenize the entire input and return all tokens
    pub fn tokenize(&mut self) -> Vec<Token> {
        let mut tokens = Vec::new();
        
        loop {
            let token = self.next_token();
            let is_eof = token.token_type == TokenType::Eof;
            tokens.push(token);
            if is_eof {
                break;
            }
        }
        
        tokens
    }
    
    fn is_at_end(&self) -> bool {
        self.position >= self.input.len()
    }
    
    fn advance(&mut self) -> char {
        let ch = self.input.chars().nth(self.position).unwrap_or('\0');
        self.position += ch.len_utf8();
        self.column += 1;
        ch
    }
    
    fn peek(&self) -> char {
        self.input.chars().nth(self.position).unwrap_or('\0')
    }
    
    fn peek_next(&self) -> char {
        self.input.chars().nth(self.position + 1).unwrap_or('\0')
    }
    
    fn current_position(&self) -> TokenPosition {
        TokenPosition {
            line: self.line,
            column: self.column,
            offset: self.position,
        }
    }
    
    fn make_token(&self, token_type: TokenType, value: &str) -> Token {
        Token {
            token_type,
            value: value.to_string(),
            position: self.current_position(),
        }
    }
    
    fn keyword_or_identifier(&self, text: &str) -> TokenType {
        match text.to_lowercase().as_str() {
            // PL/SQL keywords
            "package" => TokenType::Package,
            "body" => TokenType::Body,
            "is" => TokenType::Is,
            "procedure" => TokenType::Procedure,
            "function" => TokenType::Function,
            "begin" => TokenType::Begin,
            "end" => TokenType::End,
            "if" => TokenType::If,
            "then" => TokenType::Then,
            "else" => TokenType::Else,
            "elsif" => TokenType::ElseIf,
            "loop" => TokenType::Loop,
            "while" => TokenType::While,
            "for" => TokenType::For,
            "return" => TokenType::Return,
            "declare" => TokenType::Declare,
            "variable" => TokenType::Variable,
            "constant" => TokenType::Constant,
            "exception" => TokenType::Exception,
            "cursor" => TokenType::Cursor,
            "type" => TokenType::Type,
            "record" => TokenType::Record,
            
            // SQL keywords
            "select" => TokenType::Select,
            "from" => TokenType::From,
            "where" => TokenType::Where,
            "group" => TokenType::GroupBy,
            "having" => TokenType::Having,
            "order" => TokenType::OrderBy,
            "union" => TokenType::Union,
            "join" => TokenType::Join,
            "inner" => TokenType::Inner,
            "left" => TokenType::Left,
            "right" => TokenType::Right,
            "full" => TokenType::Full,
            "on" => TokenType::On,
            "as" => TokenType::As,
            "distinct" => TokenType::Distinct,
            
            // IFS-specific keywords
            "override" => TokenType::Override,
            "overtake" => TokenType::Overtake,
            "uncheckedaccess" => TokenType::UncheckedAccess,
            "super" => TokenType::Super,
            "layer" => TokenType::Layer,
            "component" => TokenType::Component,
            "entityname" => TokenType::EntityName,
            "enumerationname" => TokenType::EnumerationName,
            "attributes" => TokenType::Attributes,
            "values" => TokenType::Values,
            "references" => TokenType::References,
            "keys" => TokenType::Keys,
            "codegenproperties" => TokenType::CodeGenProperties,
            
            // Entity/Enumeration keywords
            "key" => TokenType::Key,
            "public" => TokenType::Public,
            "private" => TokenType::Private,
            "clientvalue" => TokenType::ClientValue,
            "labeltext" => TokenType::LabelText,
            
            // Views keywords
            "column" => TokenType::Column,
            "view" => TokenType::View,
            "flags" => TokenType::Flags,
            "datatype" => TokenType::Datatype,
            "prompt" => TokenType::Prompt,
            "ref" => TokenType::Ref,
            
            // Storage keywords
            "index" => TokenType::Index,
            "unique" => TokenType::Unique,
            "sequence" => TokenType::Sequence,
            "table" => TokenType::Table,
            "primary" => TokenType::Primary,
            "constraint" => TokenType::Constraint,
            
            // Overtake directives
            "search" => TokenType::Search,
            "replace" => TokenType::Replace,
            "append" => TokenType::Append,
            "prepend" => TokenType::Prepend,
            "textsearch" => TokenType::TextSearch,
            "textreplace" => TokenType::TextReplace,
            "textappend" => TokenType::TextAppend,
            "textprepend" => TokenType::TextPrepend,
            
            _ => TokenType::Identifier,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_tokenization() {
        let mut lexer = Lexer::new("PACKAGE test_pkg IS".to_string(), Language::PlSql);
        let tokens = lexer.tokenize();
        
        assert_eq!(tokens.len(), 5); // PACKAGE, test_pkg, IS, EOF (skipping whitespace)
        assert_eq!(tokens[0].token_type, TokenType::Package);
        assert_eq!(tokens[2].token_type, TokenType::Identifier);
        assert_eq!(tokens[2].value, "test_pkg");
    }
    
    #[test]
    fn test_comment_tokenization() {
        let mut lexer = Lexer::new("-- This is a comment\n".to_string(), Language::PlSql);
        let tokens = lexer.tokenize();
        
        assert_eq!(tokens[0].token_type, TokenType::Comment);
        assert_eq!(tokens[0].value, "-- This is a comment");
    }
}
