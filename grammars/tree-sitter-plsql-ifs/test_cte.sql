-- Common Table Expression (CTE) examples
WITH employee_hierarchy AS (
  SELECT employee_id, manager_id, first_name, last_name, 1 as level
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.employee_id, e.manager_id, e.first_name, e.last_name, eh.level + 1
  FROM employees e
  JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy
WHERE level <= 3
ORDER BY level, last_name;

-- Multiple CTEs
WITH 
  dept_totals AS (
    SELECT department_id, COUNT(*) as emp_count, AVG(salary) as avg_salary
    FROM employees
    GROUP BY department_id
  ),
  high_salary_depts AS (
    SELECT department_id, emp_count, avg_salary
    FROM dept_totals
    WHERE avg_salary > 50000
  )
SELECT d.department_name, hsd.emp_count, hsd.avg_salary
FROM high_salary_depts hsd
JOIN departments d ON hsd.department_id = d.department_id
ORDER BY hsd.avg_salary DESC;

-- Recursive CTE
WITH RECURSIVE region_hierarchy AS (
  SELECT region_id, region_name, parent_region_id, 1 as level
  FROM regions
  WHERE parent_region_id IS NULL
  UNION ALL
  SELECT r.region_id, r.region_name, r.parent_region_id, rh.level + 1
  FROM regions r
  JOIN region_hierarchy rh ON r.parent_region_id = rh.region_id
)
SELECT * FROM region_hierarchy;
