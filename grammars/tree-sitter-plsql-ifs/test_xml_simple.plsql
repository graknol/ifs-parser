-- Simple XML function test
FUNCTION test_xml_simple RETURN XMLType IS
   v_xml XMLType;
BEGIN
   -- Simple XMLELEMENT
   SELECT XMLELEMENT("employee", 'John Doe')
   INTO v_xml
   FROM dual;
   
   -- XMLFOREST
   SELECT XMLFOREST(first_name, last_name)
   INTO v_xml
   FROM employees WHERE employee_id = 100;
   
   -- XMLATTRIBUTES
   SELECT XMLELEMENT("person", 
                     XMLATTRIBUTES(employee_id AS "id"),
                     first_name)
   INTO v_xml
   FROM employees WHERE employee_id = 100;
   
   RETURN v_xml;
END test_xml_simple;
