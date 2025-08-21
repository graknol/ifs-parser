use ifs_parser::parser::{lexer::Lexer, Language};

fn main() {
    let source = r#"
        PACKAGE example_pkg AS
            FUNCTION get_value RETURN VARCHAR2;
        END example_pkg;
    "#;

    let mut lexer = Lexer::new(source.to_string(), Language::PlSql);
    let tokens = lexer.tokenize();

    println!("Tokens generated:");
    for (i, token) in tokens.iter().enumerate() {
        println!("  {}: {:?} = '{}'", i, token.token_type, token.value);
    }
}
