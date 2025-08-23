const GrammarTester = require('./grammar-tester');

describe('Complex SQL DDL and System Features', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('CREATE TABLE with advanced features', () => {
    test('CREATE TABLE with constraints and indexes', () => {
      const result = tester.parseCode(`
        CREATE TABLE employees_extended (
          employee_id NUMBER(6) CONSTRAINT emp_id_pk PRIMARY KEY,
          first_name VARCHAR2(20) NOT NULL,
          last_name VARCHAR2(25) CONSTRAINT emp_last_name_nn NOT NULL,
          email VARCHAR2(25) CONSTRAINT emp_email_uk UNIQUE,
          phone_number VARCHAR2(20),
          hire_date DATE DEFAULT SYSDATE NOT NULL,
          job_id VARCHAR2(10) NOT NULL,
          salary NUMBER(8,2) CONSTRAINT emp_salary_min CHECK (salary > 0),
          commission_pct NUMBER(2,2),
          manager_id NUMBER(6) CONSTRAINT emp_manager_fk REFERENCES employees_extended(employee_id),
          department_id NUMBER(4) CONSTRAINT emp_dept_fk REFERENCES departments(department_id),
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_date TIMESTAMP,
          CONSTRAINT emp_salary_comm_ck CHECK (salary > commission_pct * salary)
        );
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('CREATE TABLE with partitioning', () => {
      const result = tester.parseCode(`
        CREATE TABLE sales_data (
          sale_id NUMBER,
          sale_date DATE,
          customer_id NUMBER,
          product_id NUMBER,
          amount NUMBER(10,2)
        )
        PARTITION BY RANGE (sale_date) (
          PARTITION sales_q1_2023 VALUES LESS THAN (TO_DATE('2023-04-01', 'YYYY-MM-DD')),
          PARTITION sales_q2_2023 VALUES LESS THAN (TO_DATE('2023-07-01', 'YYYY-MM-DD')),
          PARTITION sales_q3_2023 VALUES LESS THAN (TO_DATE('2023-10-01', 'YYYY-MM-DD')),
          PARTITION sales_q4_2023 VALUES LESS THAN (TO_DATE('2024-01-01', 'YYYY-MM-DD'))
        );
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Advanced Views and Materialized Views', () => {
    test('Complex view with multiple joins and subqueries', () => {
      const result = tester.parseCode(`
        CREATE OR REPLACE VIEW employee_summary AS
        SELECT 
          e.employee_id,
          e.first_name || ' ' || e.last_name AS full_name,
          e.salary,
          d.department_name,
          j.job_title,
          l.city,
          l.country_id,
          (SELECT AVG(salary) 
           FROM employees e2 
           WHERE e2.department_id = e.department_id) AS avg_dept_salary,
          CASE 
            WHEN e.salary > (SELECT AVG(salary) FROM employees WHERE department_id = e.department_id) 
            THEN 'Above Average'
            ELSE 'Below Average'
          END AS salary_category
        FROM employees e
        JOIN departments d ON e.department_id = d.department_id
        JOIN jobs j ON e.job_id = j.job_id
        JOIN locations l ON d.location_id = l.location_id
        WHERE e.salary IS NOT NULL;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Materialized view with refresh options', () => {
      const result = tester.parseCode(`
        CREATE MATERIALIZED VIEW mv_dept_summary
        REFRESH FAST ON COMMIT
        AS
        SELECT 
          d.department_id,
          d.department_name,
          COUNT(e.employee_id) as employee_count,
          AVG(e.salary) as avg_salary,
          MAX(e.salary) as max_salary,
          MIN(e.salary) as min_salary
        FROM departments d
        LEFT JOIN employees e ON d.department_id = e.department_id
        GROUP BY d.department_id, d.department_name;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Triggers and Advanced PL/SQL Objects', () => {
    test('Complex trigger with multiple operations', () => {
      const result = tester.parseCode(`
        CREATE OR REPLACE TRIGGER employee_audit_trigger
          BEFORE INSERT OR UPDATE OR DELETE ON employees
          FOR EACH ROW
        DECLARE
          v_operation VARCHAR2(10);
          v_user VARCHAR2(30);
          v_timestamp TIMESTAMP;
        BEGIN
          v_user := USER;
          v_timestamp := SYSTIMESTAMP;
          
          IF INSERTING THEN
            v_operation := 'INSERT';
            :NEW.created_date := v_timestamp;
            :NEW.created_by := v_user;
          ELSIF UPDATING THEN
            v_operation := 'UPDATE';
            :NEW.updated_date := v_timestamp;
            :NEW.updated_by := v_user;
            
            -- Prevent salary decrease of more than 20%
            IF :NEW.salary < :OLD.salary * 0.8 THEN
              RAISE_APPLICATION_ERROR(-20001, 'Salary cannot be decreased by more than 20%');
            END IF;
          ELSIF DELETING THEN
            v_operation := 'DELETE';
          END IF;
          
          -- Log the operation
          INSERT INTO audit_log (
            table_name, operation, user_name, operation_date,
            old_values, new_values
          ) VALUES (
            'EMPLOYEES', v_operation, v_user, v_timestamp,
            CASE WHEN DELETING OR UPDATING THEN :OLD.employee_id || ',' || :OLD.salary END,
            CASE WHEN INSERTING OR UPDATING THEN :NEW.employee_id || ',' || :NEW.salary END
          );
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Package with advanced features', () => {
      const result = tester.parseCode(`
        CREATE OR REPLACE PACKAGE employee_mgmt_pkg AS
          -- Public types
          TYPE emp_record_type IS RECORD (
            employee_id employees.employee_id%TYPE,
            full_name VARCHAR2(100),
            salary employees.salary%TYPE
          );
          
          TYPE emp_table_type IS TABLE OF emp_record_type INDEX BY BINARY_INTEGER;
          
          -- Public constants
          c_max_salary CONSTANT NUMBER := 99999;
          c_min_salary CONSTANT NUMBER := 1000;
          
          -- Public exceptions
          invalid_salary_exception EXCEPTION;
          PRAGMA EXCEPTION_INIT(invalid_salary_exception, -20002);
          
          -- Public procedures and functions
          PROCEDURE hire_employee(
            p_first_name VARCHAR2,
            p_last_name VARCHAR2,
            p_job_id VARCHAR2,
            p_salary NUMBER DEFAULT c_min_salary,
            p_department_id NUMBER,
            p_employee_id OUT NUMBER
          );
          
          FUNCTION get_employee_bonus(p_employee_id NUMBER) RETURN NUMBER;
          FUNCTION get_department_employees(p_dept_id NUMBER) RETURN emp_table_type PIPELINED;
          
          PROCEDURE bulk_update_salaries(
            p_employees IN OUT emp_table_type,
            p_increase_pct NUMBER
          );
          
        END employee_mgmt_pkg;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Package body with complex implementations', () => {
      const result = tester.parseCode(`
        CREATE OR REPLACE PACKAGE BODY employee_mgmt_pkg AS
          -- Private variables
          g_debug_mode BOOLEAN := FALSE;
          g_last_employee_id NUMBER := 0;
          
          -- Private procedures
          PROCEDURE log_debug(p_message VARCHAR2) IS
          BEGIN
            IF g_debug_mode THEN
              DBMS_OUTPUT.PUT_LINE('[DEBUG] ' || p_message);
            END IF;
          END log_debug;
          
          -- Public implementations
          PROCEDURE hire_employee(
            p_first_name VARCHAR2,
            p_last_name VARCHAR2,
            p_job_id VARCHAR2,
            p_salary NUMBER DEFAULT c_min_salary,
            p_department_id NUMBER,
            p_employee_id OUT NUMBER
          ) IS
            v_job_exists NUMBER;
            v_dept_exists NUMBER;
          BEGIN
            log_debug('Starting hire_employee procedure');
            
            -- Validate salary
            IF p_salary < c_min_salary OR p_salary > c_max_salary THEN
              RAISE invalid_salary_exception;
            END IF;
            
            -- Validate job exists
            SELECT COUNT(*) INTO v_job_exists FROM jobs WHERE job_id = p_job_id;
            IF v_job_exists = 0 THEN
              RAISE_APPLICATION_ERROR(-20003, 'Invalid job ID: ' || p_job_id);
            END IF;
            
            -- Validate department exists  
            SELECT COUNT(*) INTO v_dept_exists FROM departments WHERE department_id = p_department_id;
            IF v_dept_exists = 0 THEN
              RAISE_APPLICATION_ERROR(-20004, 'Invalid department ID: ' || p_department_id);
            END IF;
            
            -- Generate new employee ID
            SELECT employees_seq.NEXTVAL INTO p_employee_id FROM dual;
            
            -- Insert employee
            INSERT INTO employees (
              employee_id, first_name, last_name, job_id, 
              salary, department_id, hire_date
            ) VALUES (
              p_employee_id, p_first_name, p_last_name, p_job_id,
              p_salary, p_department_id, SYSDATE
            );
            
            g_last_employee_id := p_employee_id;
            log_debug('Employee hired with ID: ' || p_employee_id);
            
          EXCEPTION
            WHEN invalid_salary_exception THEN
              RAISE_APPLICATION_ERROR(-20002, 
                'Salary must be between ' || c_min_salary || ' and ' || c_max_salary);
            WHEN OTHERS THEN
              ROLLBACK;
              RAISE;
          END hire_employee;
          
          FUNCTION get_employee_bonus(p_employee_id NUMBER) RETURN NUMBER IS
            v_salary NUMBER;
            v_commission_pct NUMBER;
            v_bonus NUMBER := 0;
          BEGIN
            SELECT salary, NVL(commission_pct, 0)
            INTO v_salary, v_commission_pct
            FROM employees
            WHERE employee_id = p_employee_id;
            
            v_bonus := v_salary * v_commission_pct;
            
            -- Additional performance bonus
            IF v_salary > 10000 THEN
              v_bonus := v_bonus + (v_salary * 0.05);
            END IF;
            
            RETURN v_bonus;
            
          EXCEPTION
            WHEN NO_DATA_FOUND THEN
              RETURN 0;
          END get_employee_bonus;
          
        END employee_mgmt_pkg;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Advanced SQL Analytics and Functions', () => {
    test('Window functions with complex partitioning', () => {
      const result = tester.parseCode(`
        SELECT 
          employee_id,
          first_name,
          department_id,
          salary,
          ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as dept_rank,
          RANK() OVER (ORDER BY salary DESC) as overall_rank,
          DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as dense_dept_rank,
          LAG(salary, 1) OVER (PARTITION BY department_id ORDER BY salary DESC) as prev_salary,
          LEAD(salary, 1) OVER (PARTITION BY department_id ORDER BY salary DESC) as next_salary,
          SUM(salary) OVER (PARTITION BY department_id) as dept_total_salary,
          AVG(salary) OVER (PARTITION BY department_id ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) as moving_avg,
          COUNT(*) OVER (PARTITION BY department_id) as dept_employee_count,
          PERCENT_RANK() OVER (ORDER BY salary) as salary_percentile,
          CUME_DIST() OVER (ORDER BY salary) as salary_cumulative_dist,
          NTILE(4) OVER (ORDER BY salary) as salary_quartile
        FROM employees
        WHERE salary IS NOT NULL
        ORDER BY department_id, salary DESC;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Pivot and unpivot operations', () => {
      const result = tester.parseCode(`
        WITH monthly_sales AS (
          SELECT 
            product_id,
            EXTRACT(MONTH FROM sale_date) as month,
            SUM(amount) as total_amount
          FROM sales
          WHERE EXTRACT(YEAR FROM sale_date) = 2023
          GROUP BY product_id, EXTRACT(MONTH FROM sale_date)
        )
        SELECT * FROM monthly_sales
        PIVOT (
          SUM(total_amount)
          FOR month IN (1 as Jan, 2 as Feb, 3 as Mar, 4 as Apr, 
                       5 as May, 6 as Jun, 7 as Jul, 8 as Aug,
                       9 as Sep, 10 as Oct, 11 as Nov, 12 as Dec)
        )
        ORDER BY product_id;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Complex analytic functions with MODEL clause', () => {
      const result = tester.parseCode(`
        SELECT country, year, sales, predicted_sales
        FROM (
          SELECT country, year, sales
          FROM sales_data
          WHERE year BETWEEN 2020 AND 2023
        )
        MODEL
          PARTITION BY (country)
          DIMENSION BY (year)
          MEASURES (sales, 0 as predicted_sales)
          RULES (
            predicted_sales[2024] = AVG(sales)[year BETWEEN 2021 AND 2023] * 1.1,
            predicted_sales[2025] = predicted_sales[2024] * 1.05
          )
        ORDER BY country, year;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('System and Database Objects', () => {
    test('Sequence creation and usage', () => {
      const result = tester.parseCode(`
        CREATE SEQUENCE emp_seq
          START WITH 1000
          INCREMENT BY 1
          MAXVALUE 999999
          MINVALUE 1
          CACHE 20
          ORDER
          CYCLE;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Synonym creation', () => {
      const result = tester.parseCode(`
        CREATE OR REPLACE PUBLIC SYNONYM emp 
        FOR hr.employees;
        
        CREATE PRIVATE SYNONYM dept 
        FOR hr.departments;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Database link usage', () => {
      const result = tester.parseCode(`
        SELECT e.employee_id, e.first_name, r.region_name
        FROM employees@remote_db e
        JOIN regions@remote_db r ON e.region_id = r.region_id
        WHERE e.hire_date > SYSDATE - 365;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });
});
