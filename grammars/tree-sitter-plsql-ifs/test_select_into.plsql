layer Core;

PROCEDURE Test_Select_Into IS
   company_name VARCHAR2(100);
   code_value VARCHAR2(50);
BEGIN
   SELECT company, code_part_value
   INTO company_name, code_value
   FROM accounting_code_part_value_tab
   WHERE company = 'COMP01'
   AND code_part = 'A';
END Test_Select_Into;
