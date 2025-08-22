use ifs_parser::parser::tree_sitter_simple::IfsPlsqlParser;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Testing IFS Tree-Sitter Parser on real Activity.plsql code...");

    let mut parser = IfsPlsqlParser::new()?;

    // Real code from Activity.plsql with @Override and super() calls
    let test_code = r#"
@Override
PROCEDURE Finite_State_Set___ (
   rec_   IN OUT activity_tab%ROWTYPE,
   state_ IN     VARCHAR2 )
IS
BEGIN
   super(rec_, state_);
   IF (rec_.case_id IS NOT NULL) AND (rec_.rowstate != 'Planned') THEN
      $IF (Component_Callc_SYS.INSTALLED) $THEN
         Cc_Case_Task_API.Handover_Status_Change(rec_.activity_seq, 'PROJECT_ACTIVITY', rec_.rowstate);
      $ELSE
         NULL;
      $END
   END IF;
END Finite_State_Set___;
"#;

    println!("Parsing real IFS Activity.plsql code:");
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
