-- Test quoted identifiers
DECLARE
  "test name" VARCHAR2(100);
  "CaseSensitive" NUMBER;
  "with-dashes" VARCHAR2(50);
  "123numeric" NUMBER;
  "SELECT" VARCHAR2(20); -- Using reserved word as identifier
BEGIN
  "test name" := 'hello sindre';
  "CaseSensitive" := 42;
  "with-dashes" := 'test-value';
  "123numeric" := 123;
  "SELECT" := 'not a keyword';
  
  dbms_output.put_line("test name");
  dbms_output.put_line("CaseSensitive");
  dbms_output.put_line("with-dashes");
  dbms_output.put_line("123numeric");
  dbms_output.put_line("SELECT");
  
  -- Qualified identifiers with quotes
  "schema"."table"."column" := 'value';
  
  -- Mixed regular and quoted identifiers
  regular_var := "quoted var";
  "quoted var" := regular_var;
END;
