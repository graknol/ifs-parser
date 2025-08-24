const GrammarTester = require('./grammar-tester');

describe('EXECUTE IMMEDIATE and Dynamic SQL', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('Basic EXECUTE IMMEDIATE syntax', () => {
    test('EXECUTE IMMEDIATE with string literal', () => {
      const result = tester.parseCode(`
        BEGIN
          EXECUTE IMMEDIATE 'CREATE TABLE temp_table (id NUMBER, name VARCHAR2(50))';
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('EXECUTE IMMEDIATE with variable', () => {
      const result = tester.parseCode(`
        DECLARE
          sql_stmt VARCHAR2(1000) := 'DROP TABLE temp_table';
        BEGIN
          EXECUTE IMMEDIATE sql_stmt;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('EXECUTE IMMEDIATE with INTO clause', () => {
    test('Single variable INTO', () => {
      const result = tester.parseCode(`
        DECLARE
          emp_count NUMBER;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM employees' INTO emp_count;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Multiple variables INTO', () => {
      const result = tester.parseCode(`
        DECLARE
          emp_name VARCHAR2(100);
          emp_salary NUMBER;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT first_name, salary FROM employees WHERE employee_id = 100'
            INTO emp_name, emp_salary;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Record type INTO', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_rec_type IS RECORD (
            name VARCHAR2(100),
            salary NUMBER
          );
          emp_rec emp_rec_type;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT first_name, salary FROM employees WHERE employee_id = 100'
            INTO emp_rec;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('EXECUTE IMMEDIATE with USING clause', () => {
    test('Single USING parameter', () => {
      const result = tester.parseCode(`
        DECLARE
          dept_id NUMBER := 10;
          emp_count NUMBER;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM employees WHERE department_id = :1'
            INTO emp_count USING dept_id;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Multiple USING parameters', () => {
      const result = tester.parseCode(`
        DECLARE
          min_sal NUMBER := 5000;
          max_sal NUMBER := 15000;
          emp_count NUMBER;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM employees WHERE salary BETWEEN :1 AND :2'
            INTO emp_count USING min_sal, max_sal;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('USING with IN, OUT, and IN OUT parameters', () => {
      const result = tester.parseCode(`
        DECLARE
          emp_id NUMBER := 100;
          new_salary NUMBER := 8000;
          old_salary NUMBER;
        BEGIN
          EXECUTE IMMEDIATE 'BEGIN update_employee_salary(:1, :2, :3); END;'
            USING IN emp_id, IN OUT new_salary, OUT old_salary;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('EXECUTE IMMEDIATE with BULK COLLECT', () => {
    test('BULK COLLECT INTO collection', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_id_array IS TABLE OF NUMBER;
          emp_ids emp_id_array;
          dept_id NUMBER := 10;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT employee_id FROM employees WHERE department_id = :1'
            BULK COLLECT INTO emp_ids USING dept_id;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('BULK COLLECT with LIMIT', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_record_array IS TABLE OF employees%ROWTYPE;
          emp_records emp_record_array;
        BEGIN
          EXECUTE IMMEDIATE 'SELECT * FROM employees'
            BULK COLLECT INTO emp_records LIMIT 1000;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('EXECUTE IMMEDIATE with returning clause', () => {
    test('DML with RETURNING clause', () => {
      const result = tester.parseCode(`
        DECLARE
          emp_id NUMBER := 100;
          new_salary NUMBER := 8000;
          old_salary NUMBER;
        BEGIN
          EXECUTE IMMEDIATE 
            'UPDATE employees SET salary = :1 WHERE employee_id = :2 RETURNING salary INTO :3'
            USING new_salary, emp_id RETURNING INTO old_salary;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('INSERT with RETURNING clause', () => {
      const result = tester.parseCode(`
        DECLARE
          new_emp_id NUMBER;
          emp_name VARCHAR2(100) := 'John Doe';
        BEGIN
          EXECUTE IMMEDIATE 
            'INSERT INTO employees (employee_id, first_name) VALUES (employees_seq.NEXTVAL, :1) RETURNING employee_id INTO :2'
            USING emp_name RETURNING INTO new_emp_id;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Complex EXECUTE IMMEDIATE scenarios', () => {
    test('Dynamic procedure call', () => {
      const result = tester.parseCode(`
        DECLARE
          proc_name VARCHAR2(100) := 'calculate_bonus';
          emp_id NUMBER := 100;
          bonus_amount NUMBER;
        BEGIN
          EXECUTE IMMEDIATE 'BEGIN ' || proc_name || '(:1, :2); END;'
            USING IN emp_id, OUT bonus_amount;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Dynamic SQL with concatenated string', () => {
      const result = tester.parseCode(`
        DECLARE
          table_name VARCHAR2(30) := 'employees';
          where_clause VARCHAR2(500) := 'department_id = 10';
          sql_stmt VARCHAR2(1000);
          emp_count NUMBER;
        BEGIN
          sql_stmt := 'SELECT COUNT(*) FROM ' || table_name || ' WHERE ' || where_clause;
          EXECUTE IMMEDIATE sql_stmt INTO emp_count;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('EXECUTE IMMEDIATE in cursor loop', () => {
      const result = tester.parseCode(`
        DECLARE
          CURSOR table_cursor IS
            SELECT table_name FROM user_tables WHERE table_name LIKE 'TEMP_%';
          sql_stmt VARCHAR2(1000);
          row_count NUMBER;
        BEGIN
          FOR table_rec IN table_cursor LOOP
            sql_stmt := 'SELECT COUNT(*) FROM ' || table_rec.table_name;
            EXECUTE IMMEDIATE sql_stmt INTO row_count;
            DBMS_OUTPUT.PUT_LINE(table_rec.table_name || ': ' || row_count || ' rows');
          END LOOP;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('EXECUTE IMMEDIATE with exception handling', () => {
      const result = tester.parseCode(`
        DECLARE
          sql_stmt VARCHAR2(1000);
          result_count NUMBER;
        BEGIN
          sql_stmt := 'SELECT COUNT(*) FROM non_existent_table';
          
          BEGIN
            EXECUTE IMMEDIATE sql_stmt INTO result_count;
          EXCEPTION
            WHEN OTHERS THEN
              DBMS_OUTPUT.PUT_LINE('Error executing: ' || sql_stmt);
              DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
              RAISE;
          END;
          
        EXCEPTION
          WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Outer exception handler');
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('OPEN cursor FOR dynamic SQL', () => {
    test('REF CURSOR with dynamic SQL', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_cursor_type IS REF CURSOR;
          emp_cursor emp_cursor_type;
          emp_name VARCHAR2(100);
          dept_id NUMBER := 10;
        BEGIN
          OPEN emp_cursor FOR 
            'SELECT first_name FROM employees WHERE department_id = :1'
            USING dept_id;
            
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

    test('Strongly typed REF CURSOR with dynamic SQL', () => {
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_cursor_type IS REF CURSOR RETURN employees%ROWTYPE;
          emp_cursor emp_cursor_type;
          emp_record employees%ROWTYPE;
        BEGIN
          OPEN emp_cursor FOR 'SELECT * FROM employees WHERE department_id = 10';
          
          LOOP
            FETCH emp_cursor INTO emp_record;
            EXIT WHEN emp_cursor%NOTFOUND;
            DBMS_OUTPUT.PUT_LINE(emp_record.first_name);
          END LOOP;
          
          CLOSE emp_cursor;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });
});
