const GrammarTester = require('./grammar-tester');

describe('PL/SQL Exception Handling and Nested Blocks', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('Basic exception handling', () => {
    test('Simple procedure with WHEN OTHERS exception', () => {
      const result = tester.parseCode(`
        PROCEDURE test_exception IS
        BEGIN
          UPDATE employees SET salary = 50000;
        EXCEPTION
          WHEN OTHERS THEN
            NULL;
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Block with specific exception handling', () => {
      const result = tester.parseCode(`
        PROCEDURE test_specific_exception IS
        BEGIN
          SELECT name INTO v_name FROM employees WHERE id = 1;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            v_name := 'Not Found';
          WHEN TOO_MANY_ROWS THEN
            v_name := 'Multiple Found';
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Exception with multiple statements in handler', () => {
      const result = tester.parseCode(`
        PROCEDURE test_complex_exception IS
          v_error_msg VARCHAR2(1000);
        BEGIN
          INSERT INTO log_table (message) VALUES ('Starting process');
          UPDATE employees SET status = 'ACTIVE';
        EXCEPTION
          WHEN OTHERS THEN
            v_error_msg := SQLERRM;
            INSERT INTO error_log (error_message, error_date) 
            VALUES (v_error_msg, SYSDATE);
            ROLLBACK;
        END;
      `);
      expect(result.success).toBe(true);
    });
  });

  describe('Nested BEGIN...END blocks', () => {
    test('Simple nested blocks without exceptions', () => {
      const result = tester.parseCode(`
        PROCEDURE test_nested_blocks IS
        BEGIN
          UPDATE employees SET salary = 50000;
          
          BEGIN
            INSERT INTO audit_log (action) VALUES ('Salary Updated');
          END;
          
          COMMIT;
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Nested blocks with inner exception handling', () => {
      const result = tester.parseCode(`
        PROCEDURE test_nested_with_inner_exception IS
        BEGIN
          UPDATE employees SET salary = 50000;
          
          BEGIN
            INSERT INTO audit_log (action) VALUES ('Salary Updated');
          EXCEPTION
            WHEN OTHERS THEN
              INSERT INTO error_log (message) VALUES ('Audit failed');
          END;
          
          COMMIT;
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Nested blocks with outer exception handling', () => {
      const result = tester.parseCode(`
        PROCEDURE test_nested_with_outer_exception IS
        BEGIN
          UPDATE employees SET salary = 50000;
          
          BEGIN
            INSERT INTO audit_log (action) VALUES ('Salary Updated');
          END;
          
          COMMIT;
        EXCEPTION
          WHEN OTHERS THEN
            ROLLBACK;
            INSERT INTO error_log (message) VALUES ('Process failed');
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Nested blocks with both inner and outer exception handling', () => {
      const result = tester.parseCode(`
        PROCEDURE test_nested_with_both_exceptions IS
        BEGIN
          UPDATE employees SET salary = 50000;
          
          BEGIN
            INSERT INTO audit_log (action) VALUES ('Salary Updated');
          EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
              UPDATE audit_log SET action = 'Salary Updated (Retry)' WHERE id = 1;
            WHEN OTHERS THEN
              INSERT INTO error_log (message) VALUES ('Inner block failed');
          END;
          
          COMMIT;
        EXCEPTION
          WHEN OTHERS THEN
            ROLLBACK;
            INSERT INTO error_log (message) VALUES ('Outer block failed');
        END;
      `);
      expect(result.success).toBe(true);
    });
  });

  describe('Multiple nested levels', () => {
    test('Three-level nested blocks', () => {
      const result = tester.parseCode(`
        PROCEDURE test_three_level_nesting IS
        BEGIN
          INSERT INTO log_table (level, message) VALUES (1, 'Level 1 start');
          
          BEGIN
            INSERT INTO log_table (level, message) VALUES (2, 'Level 2 start');
            
            BEGIN
              INSERT INTO log_table (level, message) VALUES (3, 'Level 3 operation');
              UPDATE employees SET last_updated = SYSDATE;
            EXCEPTION
              WHEN OTHERS THEN
                INSERT INTO error_log (level, message) VALUES (3, 'Level 3 error');
            END;
            
            COMMIT;
          EXCEPTION
            WHEN OTHERS THEN
              INSERT INTO error_log (level, message) VALUES (2, 'Level 2 error');
              ROLLBACK;
          END;
          
        EXCEPTION
          WHEN OTHERS THEN
            INSERT INTO error_log (level, message) VALUES (1, 'Level 1 error');
        END;
      `);
      expect(result.success).toBe(true);
    });
  });

  describe('Exception declarations and custom exceptions', () => {
    test('Procedure with custom exception declaration', () => {
      const result = tester.parseCode(`
        PROCEDURE test_custom_exception IS
          invalid_salary EXCEPTION;
          v_salary NUMBER;
        BEGIN
          SELECT salary INTO v_salary FROM employees WHERE id = 1;
          
          IF v_salary < 0 THEN
            RAISE invalid_salary;
          END IF;
          
        EXCEPTION
          WHEN invalid_salary THEN
            UPDATE employees SET salary = 0 WHERE id = 1;
          WHEN NO_DATA_FOUND THEN
            INSERT INTO employees (id, salary) VALUES (1, 0);
          WHEN OTHERS THEN
            ROLLBACK;
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Multiple custom exceptions', () => {
      const result = tester.parseCode(`
        PROCEDURE test_multiple_custom_exceptions IS
          invalid_salary EXCEPTION;
          invalid_employee_id EXCEPTION;
          business_rule_violation EXCEPTION;
          v_salary NUMBER;
          v_count NUMBER;
        BEGIN
          SELECT COUNT(*) INTO v_count FROM employees WHERE id = 1;
          
          IF v_count = 0 THEN
            RAISE invalid_employee_id;
          END IF;
          
          SELECT salary INTO v_salary FROM employees WHERE id = 1;
          
          IF v_salary < 0 THEN
            RAISE invalid_salary;
          ELSIF v_salary > 1000000 THEN
            RAISE business_rule_violation;
          END IF;
          
        EXCEPTION
          WHEN invalid_employee_id THEN
            INSERT INTO error_log (message) VALUES ('Employee not found');
          WHEN invalid_salary THEN
            UPDATE employees SET salary = 0 WHERE id = 1;
          WHEN business_rule_violation THEN
            UPDATE employees SET salary = 100000 WHERE id = 1;
          WHEN OTHERS THEN
            ROLLBACK;
        END;
      `);
      expect(result.success).toBe(true);
    });
  });

  describe('Anonymous blocks with exceptions', () => {
    test('Anonymous block with exception handling', () => {
      const result = tester.parseCode(`
        BEGIN
          UPDATE employees SET salary = salary * 1.1;
        EXCEPTION
          WHEN OTHERS THEN
            ROLLBACK;
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Anonymous block with declarations and exceptions', () => {
      const result = tester.parseCode(`
        DECLARE
          v_count NUMBER;
          insufficient_funds EXCEPTION;
        BEGIN
          SELECT COUNT(*) INTO v_count FROM employees;
          
          IF v_count = 0 THEN
            RAISE insufficient_funds;
          END IF;
          
          UPDATE employees SET salary = salary * 1.1;
        EXCEPTION
          WHEN insufficient_funds THEN
            INSERT INTO error_log (message) VALUES ('No employees to update');
          WHEN OTHERS THEN
            ROLLBACK;
        END;
      `);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases and complex scenarios', () => {
    test('Nested blocks with variable scope and exceptions', () => {
      const result = tester.parseCode(`
        PROCEDURE test_variable_scope IS
          v_outer VARCHAR2(100) := 'outer';
        BEGIN
          INSERT INTO log_table (message) VALUES (v_outer);
          
          DECLARE
            v_inner VARCHAR2(100) := 'inner';
          BEGIN
            INSERT INTO log_table (message) VALUES (v_inner);
            INSERT INTO log_table (message) VALUES (v_outer);
          EXCEPTION
            WHEN OTHERS THEN
              INSERT INTO error_log (message) VALUES ('Inner block: ' || v_inner);
          END;
          
        EXCEPTION
          WHEN OTHERS THEN
            INSERT INTO error_log (message) VALUES ('Outer block: ' || v_outer);
        END;
      `);
      expect(result.success).toBe(true);
    });

    test('Exception handling in function with nested blocks', () => {
      const result = tester.parseCode(`
        FUNCTION calculate_bonus(emp_id IN NUMBER) RETURN NUMBER IS
          v_salary NUMBER;
          v_bonus NUMBER := 0;
          calculation_error EXCEPTION;
        BEGIN
          SELECT salary INTO v_salary FROM employees WHERE id = emp_id;
          
          BEGIN
            IF v_salary <= 0 THEN
              RAISE calculation_error;
            END IF;
            
            v_bonus := v_salary * 0.1;
          EXCEPTION
            WHEN calculation_error THEN
              v_bonus := 100; -- Default bonus
            WHEN OTHERS THEN
              v_bonus := 0;
          END;
          
          RETURN v_bonus;
        EXCEPTION
          WHEN NO_DATA_FOUND THEN
            RETURN 0;
          WHEN OTHERS THEN
            RETURN -1;
        END;
      `);
      expect(result.success).toBe(true);
    });
  });
});
