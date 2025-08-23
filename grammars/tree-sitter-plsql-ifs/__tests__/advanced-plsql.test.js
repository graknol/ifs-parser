const GrammarTester = require('./grammar-tester');

describe('Advanced PL/SQL Features', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('Dynamic SQL and EXECUTE IMMEDIATE', () => {
    test('Simple EXECUTE IMMEDIATE with literal', () => {
      const result = tester.parseCode(`
        BEGIN
          EXECUTE IMMEDIATE 'DROP TABLE temp_table';
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('EXECUTE IMMEDIATE with variable', () => {
      const result = tester.parseCode(`
        DECLARE
          sql_stmt VARCHAR2(1000);
        BEGIN
          sql_stmt := 'SELECT COUNT(*) FROM employees';
          EXECUTE IMMEDIATE sql_stmt;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('EXECUTE IMMEDIATE with INTO clause', () => {
      const result = tester.parseCode(`
        DECLARE
          emp_count NUMBER;
          sql_stmt VARCHAR2(1000) := 'SELECT COUNT(*) FROM employees';
        BEGIN
          EXECUTE IMMEDIATE sql_stmt INTO emp_count;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('EXECUTE IMMEDIATE with USING parameters', () => {
      const result = tester.parseCode(`
        DECLARE
          emp_name VARCHAR2(100);
          dept_id NUMBER := 10;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT first_name FROM employees WHERE department_id = :1'
            INTO emp_name USING dept_id;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Complex EXECUTE IMMEDIATE with multiple USING parameters', () => {
      const result = tester.parseCode(`
        DECLARE
          result_count NUMBER;
          min_sal NUMBER := 5000;
          max_sal NUMBER := 15000;
          dept VARCHAR2(20) := 'SALES';
        BEGIN
          EXECUTE IMMEDIATE 
            'SELECT COUNT(*) FROM employees WHERE salary BETWEEN :min AND :max AND department = :dept'
            INTO result_count
            USING min_sal, max_sal, dept;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Complex Cursor Operations', () => {
    test('Cursor with parameters', () => {
      const result = tester.parseCode(`
        DECLARE
          CURSOR emp_cursor(dept_id NUMBER, min_salary NUMBER) IS
            SELECT employee_id, first_name, salary
            FROM employees
            WHERE department_id = dept_id AND salary >= min_salary
            ORDER BY salary DESC;
        BEGIN
          FOR emp_rec IN emp_cursor(10, 5000) LOOP
            DBMS_OUTPUT.PUT_LINE(emp_rec.first_name || ': ' || emp_rec.salary);
          END LOOP;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Cursor with %ROWTYPE and explicit operations', () => {
      const result = tester.parseCode(`
        DECLARE
          CURSOR emp_cursor IS SELECT * FROM employees WHERE department_id = 10;
          emp_rec emp_cursor%ROWTYPE;
        BEGIN
          OPEN emp_cursor;
          LOOP
            FETCH emp_cursor INTO emp_rec;
            EXIT WHEN emp_cursor%NOTFOUND;
            DBMS_OUTPUT.PUT_LINE(emp_rec.first_name);
          END LOOP;
          CLOSE emp_cursor;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Cursor with REF CURSOR type', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_cursor_type IS REF CURSOR;
          emp_cursor emp_cursor_type;
          emp_name VARCHAR2(100);
        BEGIN
          OPEN emp_cursor FOR 'SELECT first_name FROM employees WHERE department_id = 10';
          LOOP
            FETCH emp_cursor INTO emp_name;
            EXIT WHEN emp_cursor%NOTFOUND;
            DBMS_OUTPUT.PUT_LINE(emp_name);
          END LOOP;
          CLOSE emp_cursor;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Collections and Bulk Operations', () => {
    test('VARRAY with constructor and methods', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE name_array_type IS VARRAY(10) OF VARCHAR2(50);
          names name_array_type;
        BEGIN
          names := name_array_type('John', 'Jane', 'Bob');
          FOR i IN names.FIRST..names.LAST LOOP
            DBMS_OUTPUT.PUT_LINE(names(i));
          END LOOP;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Associative array (INDEX BY)', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE salary_array_type IS TABLE OF NUMBER INDEX BY VARCHAR2(50);
          salaries salary_array_type;
          emp_name VARCHAR2(50);
        BEGIN
          salaries('John') := 5000;
          salaries('Jane') := 6000;
          
          emp_name := salaries.FIRST;
          WHILE emp_name IS NOT NULL LOOP
            DBMS_OUTPUT.PUT_LINE(emp_name || ': ' || salaries(emp_name));
            emp_name := salaries.NEXT(emp_name);
          END LOOP;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('BULK COLLECT operations', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_id_array IS TABLE OF employees.employee_id%TYPE;
          TYPE emp_name_array IS TABLE OF employees.first_name%TYPE;
          emp_ids emp_id_array;
          emp_names emp_name_array;
        BEGIN
          SELECT employee_id, first_name
          BULK COLLECT INTO emp_ids, emp_names
          FROM employees
          WHERE department_id = 10;
          
          FOR i IN 1..emp_ids.COUNT LOOP
            DBMS_OUTPUT.PUT_LINE(emp_ids(i) || ': ' || emp_names(i));
          END LOOP;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('FORALL bulk DML operations', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_id_array IS TABLE OF NUMBER;
          emp_ids emp_id_array;
        BEGIN
          SELECT employee_id BULK COLLECT INTO emp_ids
          FROM employees WHERE department_id = 10;
          
          FORALL i IN emp_ids.FIRST..emp_ids.LAST
            UPDATE employees 
            SET salary = salary * 1.1 
            WHERE employee_id = emp_ids(i);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Advanced Exception Handling', () => {
    test('User-defined exceptions with PRAGMA EXCEPTION_INIT', () => {
      const result = tester.parseCode(`
        DECLARE
          insufficient_funds EXCEPTION;
          PRAGMA EXCEPTION_INIT(insufficient_funds, -20001);
          balance NUMBER := 100;
          withdrawal NUMBER := 150;
        BEGIN
          IF withdrawal > balance THEN
            RAISE_APPLICATION_ERROR(-20001, 'Insufficient funds');
          END IF;
        EXCEPTION
          WHEN insufficient_funds THEN
            DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Exception handling with SQLCODE and SQLERRM', () => {
      const result = tester.parseCode(`
        DECLARE
          v_error_code NUMBER;
          v_error_message VARCHAR2(1000);
        BEGIN
          SELECT COUNT(*) INTO v_error_code FROM non_existent_table;
        EXCEPTION
          WHEN OTHERS THEN
            v_error_code := SQLCODE;
            v_error_message := SQLERRM;
            DBMS_OUTPUT.PUT_LINE('Error ' || v_error_code || ': ' || v_error_message);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Advanced Control Structures', () => {
    test('GOTO and labels', () => {
      const result = tester.parseCode(`
        DECLARE
          counter NUMBER := 0;
        BEGIN
          <<start_loop>>
          counter := counter + 1;
          DBMS_OUTPUT.PUT_LINE('Counter: ' || counter);
          
          IF counter < 5 THEN
            GOTO start_loop;
          END IF;
          
          <<end_program>>
          DBMS_OUTPUT.PUT_LINE('Done');
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Labeled loops with EXIT and CONTINUE', () => {
      const result = tester.parseCode(`
        BEGIN
          <<outer_loop>>
          FOR i IN 1..5 LOOP
            <<inner_loop>>
            FOR j IN 1..5 LOOP
              IF i = 3 AND j = 3 THEN
                EXIT outer_loop;
              END IF;
              
              IF j = 2 THEN
                CONTINUE inner_loop;
              END IF;
              
              DBMS_OUTPUT.PUT_LINE('i=' || i || ', j=' || j);
            END LOOP inner_loop;
          END LOOP outer_loop;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Package and Object-Oriented Features', () => {
    test('Package with initialization section', () => {
      const result = tester.parseCode(`
        PACKAGE BODY utils_pkg IS
          g_initialized BOOLEAN := FALSE;
          
          PROCEDURE init IS
          BEGIN
            IF NOT g_initialized THEN
              DBMS_OUTPUT.PUT_LINE('Initializing package');
              g_initialized := TRUE;
            END IF;
          END init;
          
          FUNCTION get_version RETURN VARCHAR2 IS
          BEGIN
            RETURN '1.0.0';
          END get_version;
          
        BEGIN
          init(); -- Package initialization
        END utils_pkg;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Object type with methods', () => {
      const result = tester.parseCode(`
        CREATE OR REPLACE TYPE employee_type AS OBJECT (
          employee_id NUMBER,
          first_name VARCHAR2(50),
          last_name VARCHAR2(50),
          salary NUMBER,
          
          MEMBER FUNCTION get_full_name RETURN VARCHAR2,
          MEMBER PROCEDURE give_raise(amount NUMBER),
          CONSTRUCTOR FUNCTION employee_type(
            p_id NUMBER,
            p_first VARCHAR2,
            p_last VARCHAR2,
            p_salary NUMBER DEFAULT 0
          ) RETURN SELF AS RESULT
        );
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Complex SQL in PL/SQL', () => {
    test('Hierarchical queries in PL/SQL', () => {
      const result = tester.parseCode(`
        DECLARE
          CURSOR hierarchy_cursor IS
            SELECT employee_id, first_name, manager_id, LEVEL
            FROM employees
            START WITH manager_id IS NULL
            CONNECT BY PRIOR employee_id = manager_id
            ORDER SIBLINGS BY first_name;
        BEGIN
          FOR emp_rec IN hierarchy_cursor LOOP
            DBMS_OUTPUT.PUT_LINE(
              LPAD(' ', (emp_rec.LEVEL - 1) * 2) || emp_rec.first_name
            );
          END LOOP;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Window functions in PL/SQL', () => {
      const result = tester.parseCode(`
        DECLARE
          CURSOR ranked_employees IS
            SELECT 
              employee_id,
              first_name,
              salary,
              RANK() OVER (ORDER BY salary DESC) as salary_rank,
              ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as dept_rank
            FROM employees;
        BEGIN
          FOR emp_rec IN ranked_employees LOOP
            DBMS_OUTPUT.PUT_LINE(
              emp_rec.first_name || ' - Rank: ' || emp_rec.salary_rank
            );
          END LOOP;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Common Table Expressions (WITH clause)', () => {
      const result = tester.parseCode(`
        DECLARE
          total_sales NUMBER;
        BEGIN
          WITH monthly_sales AS (
            SELECT 
              EXTRACT(YEAR FROM order_date) as year,
              EXTRACT(MONTH FROM order_date) as month,
              SUM(amount) as monthly_total
            FROM orders
            GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
          ),
          yearly_sales AS (
            SELECT year, SUM(monthly_total) as yearly_total
            FROM monthly_sales
            GROUP BY year
          )
          SELECT SUM(yearly_total) INTO total_sales
          FROM yearly_sales;
          
          DBMS_OUTPUT.PUT_LINE('Total sales: ' || total_sales);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('MERGE statement in PL/SQL', () => {
      const result = tester.parseCode(`
        BEGIN
          MERGE INTO employee_archive a
          USING (
            SELECT employee_id, first_name, last_name, salary
            FROM employees
            WHERE hire_date < ADD_MONTHS(SYSDATE, -12)
          ) e
          ON (a.employee_id = e.employee_id)
          WHEN MATCHED THEN
            UPDATE SET
              a.first_name = e.first_name,
              a.last_name = e.last_name,
              a.salary = e.salary,
              a.last_updated = SYSDATE
          WHEN NOT MATCHED THEN
            INSERT (employee_id, first_name, last_name, salary, last_updated)
            VALUES (e.employee_id, e.first_name, e.last_name, e.salary, SYSDATE);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Advanced Data Types and Expressions', () => {
    test('CASE expressions in various contexts', () => {
      const result = tester.parseCode(`
        DECLARE
          emp_grade VARCHAR2(10);
          bonus NUMBER;
          salary NUMBER := 5000;
        BEGIN
          emp_grade := CASE 
            WHEN salary > 10000 THEN 'Senior'
            WHEN salary > 5000 THEN 'Mid'
            ELSE 'Junior'
          END;
          
          bonus := CASE emp_grade
            WHEN 'Senior' THEN salary * 0.2
            WHEN 'Mid' THEN salary * 0.1
            WHEN 'Junior' THEN salary * 0.05
            ELSE 0
          END;
          
          DBMS_OUTPUT.PUT_LINE('Grade: ' || emp_grade || ', Bonus: ' || bonus);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('DECODE function and complex expressions', () => {
      const result = tester.parseCode(`
        DECLARE
          department_name VARCHAR2(50);
          dept_id NUMBER := 10;
          status VARCHAR2(20);
        BEGIN
          department_name := DECODE(dept_id,
            10, 'Administration',
            20, 'Marketing', 
            30, 'Purchasing',
            40, 'Human Resources',
            'Unknown Department'
          );
          
          status := CASE 
            WHEN LENGTH(department_name) > 10 THEN 'Long Name'
            WHEN INSTR(department_name, 'Admin') > 0 THEN 'Administrative'
            ELSE 'Standard'
          END;
          
          DBMS_OUTPUT.PUT_LINE(department_name || ' - ' || status);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Regular expressions and advanced string operations', () => {
      const result = tester.parseCode(`
        DECLARE
          email VARCHAR2(100) := 'john.doe@company.com';
          phone VARCHAR2(20) := '555-123-4567';
          valid_email BOOLEAN;
          formatted_phone VARCHAR2(20);
        BEGIN
          valid_email := REGEXP_LIKE(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
          
          formatted_phone := REGEXP_REPLACE(phone, '([0-9]{3})-([0-9]{3})-([0-9]{4})', '(\\1) \\2-\\3');
          
          IF valid_email THEN
            DBMS_OUTPUT.PUT_LINE('Valid email: ' || email);
          END IF;
          
          DBMS_OUTPUT.PUT_LINE('Formatted phone: ' || formatted_phone);
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });
});
