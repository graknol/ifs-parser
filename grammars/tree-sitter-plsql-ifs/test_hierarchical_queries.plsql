PROCEDURE Test_Hierarchical_Queries IS
BEGIN
   -- Basic hierarchical query with LEVEL
   SELECT level x,
          party, orig_recp, ref_recp, orig_amt, ref_amt
   FROM my_level1
   WHERE party BETWEEN 'A0001' AND 'A0003'
   CONNECT BY
     PRIOR orig_recp = ref_recp AND
     PRIOR party = party
   START WITH ref_recp IS NULL;
   
   -- Hierarchical query with NOCYCLE
   SELECT level, employee_id, manager_id, employee_name
   FROM employees
   START WITH manager_id IS NULL
   CONNECT BY NOCYCLE PRIOR employee_id = manager_id;
   
   -- More complex hierarchical query
   SELECT LEVEL,
          LPAD(' ', 2 * (LEVEL - 1)) || employee_name AS org_chart,
          employee_id,
          manager_id,
          salary
   FROM employees
   START WITH manager_id IS NULL
   CONNECT BY PRIOR employee_id = manager_id
   ORDER BY LEVEL, employee_name;

END Test_Hierarchical_Queries;
