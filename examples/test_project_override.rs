use ifs_parser::parser::tree_sitter_simple::IfsPlsqlParser;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing IFS Tree-Sitter Parser on Project.plsql @Override function...");

    let mut parser = IfsPlsqlParser::new()?;

    // Real @Override function from Project.plsql with super() call
    let test_code = r#"
@Override
FUNCTION Get_Baseline_Revision_Number (
   project_id_ IN VARCHAR2 ) RETURN NUMBER
IS
   baseline_revision_number_     project_tab.baseline_revision_number%TYPE;
BEGIN
   baseline_revision_number_ := super(project_id_);
   
   IF (baseline_revision_number_ IS NULL) THEN
      RETURN 0;
   ELSE
      RETURN baseline_revision_number_;
   END IF;
END Get_Baseline_Revision_Number;
"#;

    println!("Parsing real IFS Project.plsql @Override function:");
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
