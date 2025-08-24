const GrammarTester = require('./grammar-tester');

describe('Advanced Cursor Features', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('FOR UPDATE clauses', () => {
    test('basic FOR UPDATE', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor IS
            SELECT employee_id, salary FROM employees FOR UPDATE;
        BEGIN
          NULL;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('FOR UPDATE OF specific columns', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor IS
            SELECT * FROM employees FOR UPDATE OF salary, commission;
        BEGIN
          NULL;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('FOR UPDATE NOWAIT', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor IS
            SELECT * FROM employees FOR UPDATE NOWAIT;
        BEGIN
          NULL;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('FOR UPDATE OF with NOWAIT', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor (dept_id NUMBER, min_salary NUMBER := 0) IS
            SELECT * FROM employees 
            WHERE department_id = dept_id 
            AND salary >= min_salary
            FOR UPDATE OF salary NOWAIT;
        BEGIN
          NULL;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('FOR UPDATE WAIT with timeout', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor IS
            SELECT * FROM employees FOR UPDATE WAIT 10;
        BEGIN
          NULL;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('real-world IFS pattern', () => {
      const sql = `
        PROCEDURE Update_Activities IS
          CURSOR all_act IS
            SELECT activity_seq, total_key_path 
            FROM activity
            WHERE project_id = project_id_
            FOR UPDATE OF total_key_path;
        BEGIN
          FOR act_rec IN all_act LOOP
            -- Process record
            UPDATE activity 
            SET total_key_path = calculate_path(act_rec.activity_seq)
            WHERE CURRENT OF all_act;
          END LOOP;
        END Update_Activities;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('CURRENT OF clauses', () => {
    test('UPDATE with CURRENT OF', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor IS
            SELECT * FROM employees FOR UPDATE;
          emp_rec employees%ROWTYPE;
        BEGIN
          OPEN emp_cursor;
          FETCH emp_cursor INTO emp_rec;
          UPDATE employees SET salary = salary * 1.1 WHERE CURRENT OF emp_cursor;
          CLOSE emp_cursor;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('DELETE with CURRENT OF', () => {
      const sql = `
        DECLARE
          CURSOR emp_cursor IS
            SELECT * FROM employees WHERE status = 'INACTIVE' FOR UPDATE;
        BEGIN
          FOR emp_rec IN emp_cursor LOOP
            IF emp_rec.last_login < SYSDATE - 365 THEN
              DELETE FROM employees WHERE CURRENT OF emp_cursor;
            END IF;
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('IFS Activity pattern from real code', () => {
      const sql = `
        PROCEDURE Process_Activities IS
          CURSOR all_act IS
            SELECT activity_seq, total_key_path 
            FROM activity
            FOR UPDATE OF total_key_path;
        BEGIN
          FOR act_rec IN all_act LOOP
            IF act_rec.total_key_path IS NULL THEN
               UPDATE activity 
               SET total_key_path = Generate_Key_Path(act_rec.activity_seq)
               WHERE CURRENT OF all_act;
            END IF;
          END LOOP;
        END Process_Activities;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('Complex cursor scenarios', () => {
    test('nested cursors with FOR UPDATE and CURRENT OF', () => {
      const sql = `
        PROCEDURE Complex_Update IS
          CURSOR dept_cursor IS
            SELECT department_id FROM departments FOR UPDATE;
          CURSOR emp_cursor(dept_id NUMBER) IS
            SELECT employee_id, salary FROM employees 
            WHERE department_id = dept_id FOR UPDATE OF salary;
        BEGIN
          FOR dept_rec IN dept_cursor LOOP
            FOR emp_rec IN emp_cursor(dept_rec.department_id) LOOP
              UPDATE employees 
              SET salary = salary * 1.1 
              WHERE CURRENT OF emp_cursor;
            END LOOP;
            
            UPDATE departments 
            SET last_updated = SYSDATE 
            WHERE CURRENT OF dept_cursor;
          END LOOP;
        END Complex_Update;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('cursor with JOIN and FOR UPDATE OF', () => {
      const sql = `
        DECLARE
          CURSOR emp_dept_cursor IS
            SELECT e.employee_id, e.salary, d.department_name
            FROM employees e
            JOIN departments d ON e.department_id = d.department_id
            WHERE e.status = 'ACTIVE'
            FOR UPDATE OF e.salary, d.budget;
        BEGIN
          FOR rec IN emp_dept_cursor LOOP
            UPDATE employees 
            SET salary = salary * 1.05 
            WHERE employee_id = rec.employee_id;
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('dynamic cursor with FOR UPDATE', () => {
      const sql = `
        PROCEDURE Dynamic_Update(table_name VARCHAR2) IS
          TYPE cursor_type IS REF CURSOR;
          dyn_cursor cursor_type;
          sql_stmt VARCHAR2(1000);
        BEGIN
          sql_stmt := 'SELECT * FROM ' || table_name || ' FOR UPDATE NOWAIT';
          OPEN dyn_cursor FOR sql_stmt;
          -- Process cursor
          CLOSE dyn_cursor;
        END Dynamic_Update;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });
});
