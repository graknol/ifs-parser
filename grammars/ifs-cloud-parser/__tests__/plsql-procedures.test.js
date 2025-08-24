const GrammarTester = require('./grammar-tester');

describe('PL/SQL Procedures and Functions', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('Basic procedure declarations', () => {
    test('Simple procedure without parameters', () => {
      const result = tester.parseCode(`
        PROCEDURE update_employee_status IS
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Procedure with IN parameter', () => {
      const result = tester.parseCode(`
        PROCEDURE update_salary(emp_id IN NUMBER) IS
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Procedure with OUT parameter', () => {
      const result = tester.parseCode(`
        PROCEDURE get_employee_name(emp_id IN NUMBER, emp_name OUT VARCHAR2) IS
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Procedure with IN OUT parameter', () => {
      const result = tester.parseCode(`
        PROCEDURE process_salary(salary IN OUT NUMBER) IS
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Procedure with multiple parameters', () => {
      const result = tester.parseCode(`
        PROCEDURE update_employee(
          emp_id IN NUMBER,
          emp_name IN VARCHAR2,
          salary OUT NUMBER,
          status IN OUT VARCHAR2
        ) IS
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Function declarations', () => {
    test('Simple function with return type', () => {
      const result = tester.parseCode(`
        FUNCTION get_employee_count RETURN NUMBER IS
        BEGIN
          RETURN 0;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Function with parameters', () => {
      const result = tester.parseCode(`
        FUNCTION get_employee_salary(emp_id IN NUMBER) RETURN NUMBER IS
        BEGIN
          RETURN 0;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Function with multiple parameters and complex return type', () => {
      const result = tester.parseCode(`
        FUNCTION format_employee_info(
          emp_id IN NUMBER,
          include_salary IN BOOLEAN DEFAULT FALSE
        ) RETURN VARCHAR2 IS
        BEGIN
          RETURN 'Employee Info';
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Variable and constant declarations', () => {
    test('Variable declarations in procedure', () => {
      const result = tester.parseCode(`
        PROCEDURE test_variables IS
          v_count NUMBER;
          v_name VARCHAR2(100);
          v_active BOOLEAN := TRUE;
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Constant declarations', () => {
      const result = tester.parseCode(`
        PROCEDURE test_constants IS
          c_max_salary CONSTANT NUMBER := 100000;
          c_company_name CONSTANT VARCHAR2(50) := 'ACME Corp';
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Type-anchored declarations', () => {
      const result = tester.parseCode(`
        PROCEDURE test_anchored IS
          v_emp_name employees.name%TYPE;
          v_emp_record employees%ROWTYPE;
        BEGIN
          NULL;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Basic procedure body', () => {
    test('Procedure with variable assignment', () => {
      const result = tester.parseCode(`
        PROCEDURE test_assignment IS
          v_count NUMBER;
        BEGIN
          v_count := 10;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Procedure with SELECT INTO', () => {
      const result = tester.parseCode(`
        PROCEDURE get_employee_info(emp_id IN NUMBER) IS
          v_name VARCHAR2(100);
          v_salary NUMBER;
        BEGIN
          SELECT name, salary 
          INTO v_name, v_salary 
          FROM employees 
          WHERE id = emp_id;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Procedure with basic SQL operations', () => {
      const result = tester.parseCode(`
        PROCEDURE update_employee_salary(emp_id IN NUMBER, new_salary IN NUMBER) IS
        BEGIN
          UPDATE employees 
          SET salary = new_salary 
          WHERE id = emp_id;
          
          COMMIT;
        END;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });
});
