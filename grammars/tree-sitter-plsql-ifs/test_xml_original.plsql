-- Test the original XML queries
FUNCTION test_xml_original IS
   l_xmltype XMLType;
BEGIN
   SELECT XMLELEMENT("employees",
            XMLAGG(
              XMLELEMENT("employee",
                XMLATTRIBUTES(
                  e.empno AS "empno",
                  e.ename AS "ename",
                  e.job AS "job",
                  TO_CHAR(e.hiredate, 'DD-MON-YYYY') AS "hiredate"
                )
              )
            ) 
          )
   INTO   l_xmltype
   FROM   emp e;

   SELECT XMLELEMENT("employees",
            XMLAGG(
              XMLELEMENT("employee",
                XMLFOREST(
                  e.empno AS "empno",
                  e.ename AS "ename",
                  e.job AS "job",
                  TO_CHAR(e.hiredate, 'DD-MON-YYYY') AS "hiredate"
                )
              )
            ) 
          )
   INTO   l_xmltype
   FROM   emp e;
END test_xml_original;
