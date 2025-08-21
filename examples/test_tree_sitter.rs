use ifs_parser::parser::tree_sitter_simple::IfsPlsqlParser;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing IFS Tree-Sitter Parser...");
    
    let mut parser = IfsPlsqlParser::new()?;
    
    let test_code = r#"
@Override
PROCEDURE Test_Procedure___ (
   param1_ IN VARCHAR2,
   param2_ OUT NUMBER
)
IS
BEGIN
   NULL;
END Test_Procedure___;
"#;

    println!("Parsing test code:");
    println!("{}", test_code);
    
    match parser.parse(test_code) {
        Ok(ast) => {
            println!("✅ Parsing successful!");
            println!("AST: {:#?}", ast);
        }
        Err(e) => {
            println!("❌ Parsing failed: {}", e);
        }
    }
    
    Ok(())
}
