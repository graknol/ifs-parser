use ifs_parser::parser::{parse_source, Language};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Test parsing IFS-style PL/SQL with direct function definitions
    let plsql_source = r#"
        -- Public function (no underscores)
        FUNCTION Get_Value RETURN VARCHAR2
        IS
        BEGIN
            RETURN 'Hello World';
        END Get_Value;
        
        -- Protected procedure (two underscores)  
        PROCEDURE Create_Customer__ (
            name_ IN VARCHAR2,
            id_ OUT NUMBER
        )
        IS
        BEGIN
            id_ := 123;
        END Create_Customer__;
        
        -- Private procedure (three underscores)
        PROCEDURE Internal_Helper___ 
        IS
        BEGIN
            NULL;
        END Internal_Helper___;
    "#;

    let ast = parse_source(plsql_source, Language::PlSql)?;
    println!("Successfully parsed PL/SQL Function: {:#?}", ast);

    // Test parsing an entity definition (placeholder content)
    let entity_source = r#"
        entity ExampleEntity {
            attribute_name : String(50) not null;
        }
    "#;

    let ast = parse_source(entity_source, Language::Entity)?;
    println!("Successfully parsed Entity: {:#?}", ast);

    println!("IFS Parser is working correctly!");

    Ok(())
}
