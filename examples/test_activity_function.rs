use ifs_parser::parser::tree_sitter_simple::IfsPlsqlParser;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing IFS Tree-Sitter Parser on real Activity.plsql function...");

    let mut parser = IfsPlsqlParser::new()?;

    // Real standalone function from Activity.plsql
    let test_code = r#"
FUNCTION Generate_Activity_Seq___ RETURN NUMBER
IS
   w_activity_seq_  NUMBER;
   
   CURSOR seq IS
      SELECT activity_seq.NEXTVAL
      FROM   DUAL;
BEGIN
   OPEN  seq;
   FETCH seq INTO w_activity_seq_;
   CLOSE seq;
   RETURN w_activity_seq_;
END Generate_Activity_Seq___;
"#;

    println!("Parsing real IFS Activity.plsql function:");
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
