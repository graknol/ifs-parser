use ifs_parser::parser::{lexer::Lexer, Language};

fn main() {
    let source = "FUNCTION Get_Value RETURN VARCHAR2";
    
    let mut lexer = Lexer::new(source.to_string(), Language::PlSql);
    let tokens = lexer.tokenize();
    
    println!("Source: '{}'", source);
    println!("Tokens:");
    for (i, token) in tokens.iter().enumerate() {
        println!("  {}: {:?} = '{}' at {}:{}", 
            i, token.token_type, token.value, token.position.line, token.position.column);
    }
}
