-- Test ROWNUM and other pseudo-columns
FUNCTION test_pseudo_columns RETURN NUMBER IS
   v_count NUMBER;
   v_id VARCHAR2(100);
   v_xml XMLType;
BEGIN
   -- Simple ROWNUM usage
   SELECT COUNT(*) 
   INTO v_count
   FROM employees 
   WHERE ROWNUM <= 10;
   
   -- ROWNUM in select list
   SELECT ROWNUM, employee_id, name
   FROM employees
   WHERE ROWNUM <= 5;
   
   -- ROWID usage
   SELECT ROWID, employee_id
   FROM employees
   WHERE employee_id = 100;
   
   -- Complex query with ROWNUM
   SELECT * FROM (
      SELECT ROWNUM as rn, e.*
      FROM (
         SELECT * FROM employees ORDER BY salary DESC
      ) e
      WHERE ROWNUM <= 20
   ) WHERE rn > 10;
   
   -- LEVEL in hierarchical query
   SELECT LEVEL, employee_id, manager_id
   FROM employees
   START WITH manager_id IS NULL
   CONNECT BY PRIOR employee_id = manager_id
   WHERE LEVEL <= 3;
   
   -- CONNECT_BY pseudo-columns
   SELECT LEVEL, 
          employee_id,
          CONNECT_BY_ISLEAF,
          CONNECT_BY_ISCYCLE
   FROM employees
   START WITH manager_id IS NULL
   CONNECT BY PRIOR employee_id = manager_id;
   
   -- XML pseudo-columns and functions
   SELECT XMLELEMENT("Employee", 
          XMLATTRIBUTES(employee_id as "id"),
          XMLFOREST(first_name, last_name))
   FROM employees;
   
   -- XMLTable usage
   SELECT *
   FROM XMLTABLE('/employees/employee'
                 PASSING v_xml
                 COLUMNS employee_id NUMBER PATH '@id',
                        first_name VARCHAR2(50) PATH 'first_name',
                        last_name VARCHAR2(50) PATH 'last_name');
   
   -- XMLQUERY and XMLEXISTS
   SELECT employee_id
   FROM employees e
   WHERE XMLEXISTS('$xml/employee[@id=$id]' 
                   PASSING e.xml_data as "xml", 
                          e.employee_id as "id");
   
   SELECT XMLQUERY('//employee/name/text()' 
                   PASSING v_xml 
                   RETURNING CONTENT)
   FROM dual;
   
   RETURN v_count;
END test_pseudo_columns;
