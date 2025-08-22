-- Test XML construction queries
FUNCTION test_xml_queries RETURN XMLType IS
   l_xmltype XMLType;
   v_result XMLType;
BEGIN
   -- XMLELEMENT with XMLAGG and XMLATTRIBUTES example
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

   -- XMLELEMENT with XMLAGG and XMLFOREST example
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

   -- Simple XMLELEMENT
   SELECT XMLELEMENT("person", 
            XMLELEMENT("name", first_name),
            XMLELEMENT("age", age))
   FROM   people;

   -- XMLFOREST without AS clause
   SELECT XMLFOREST(first_name, last_name, age)
   FROM   people;

   -- XMLCONCAT example
   SELECT XMLCONCAT(
            XMLELEMENT("first", first_name),
            XMLELEMENT("last", last_name)
          )
   FROM   people;

   -- Nested XML construction
   SELECT XMLELEMENT("department",
            XMLATTRIBUTES(d.dept_id AS "id"),
            XMLELEMENT("name", d.dept_name),
            XMLAGG(
              XMLELEMENT("employee",
                XMLFOREST(
                  e.emp_id,
                  e.name,
                  e.salary
                )
              )
            )
          )
   FROM   departments d
   JOIN   employees e ON d.dept_id = e.dept_id
   GROUP BY d.dept_id, d.dept_name;

   RETURN l_xmltype;
END test_xml_queries;
