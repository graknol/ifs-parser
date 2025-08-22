-- Simple XML function tests
FUNCTION test_simple_xml RETURN XMLType IS
   l_xml XMLType;
BEGIN
   -- Simple XMLELEMENT
   l_xml := XMLELEMENT("person", 'John');
   
   -- XMLELEMENT with XMLATTRIBUTES
   l_xml := XMLELEMENT("employee", 
              XMLATTRIBUTES(123 AS "id", 'John' AS "name"));
              
   -- XMLFOREST simple
   l_xml := XMLFOREST(first_name, last_name);
   
   -- XMLFOREST with AS
   l_xml := XMLFOREST(first_name AS "fname", last_name AS "lname");
   
   -- XMLAGG
   l_xml := XMLAGG(XMLELEMENT("item", value));
   
   -- XMLCONCAT
   l_xml := XMLCONCAT(
              XMLELEMENT("first", 'John'),
              XMLELEMENT("last", 'Doe')
            );
   
   -- Nested XML functions
   l_xml := XMLELEMENT("person",
              XMLATTRIBUTES(emp_id AS "id"),
              XMLFOREST(first_name, last_name)
            );
            
   RETURN l_xml;
END test_simple_xml;
