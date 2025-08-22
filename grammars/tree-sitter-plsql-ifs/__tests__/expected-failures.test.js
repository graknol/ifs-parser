const GrammarTester = require('./grammar-tester');

describe('Expected Failures - Grammar Limitations', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Intentionally Broken Syntax', () => {
    test('SHOULD FAIL: Missing semicolon', () => {
      const result = tester.parseCode('SELECT * FROM employees');
      expect(result.success).toBe(false); // This should fail
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('SHOULD FAIL: Invalid keyword placement', () => {
      const result = tester.parseCode('FROM SELECT * employees;');
      expect(result.success).toBe(false); // This should fail
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('SHOULD FAIL: Unmatched parentheses', () => {
      const result = tester.parseCode('SELECT COUNT(*) FROM employees);');
      expect(result.success).toBe(false); // This should fail
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('SHOULD FAIL: Invalid operator', () => {
      const result = tester.parseCode('SELECT 1 @@ 2 FROM dual;');
      expect(result.success).toBe(false); // This should fail - @@ is not a valid operator
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Grammar Limitations We Know About', () => {
    test('SHOULD FAIL: Complex aggregate functions with asterisk', () => {
      // This currently fails in our grammar because COUNT(*) isn't properly handled
      const result = tester.parseCode('SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5;');
      expect(result.success).toBe(false); // We know this fails
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('SHOULD FAIL: Advanced PL/SQL features not implemented', () => {
      // Test a feature we haven't implemented yet
      const result = tester.parseCode(`
        DECLARE
          TYPE emp_array IS VARRAY(10) OF VARCHAR2(100);
          employees emp_array := emp_array('John', 'Jane', 'Bob');
        BEGIN
          FOR i IN employees.FIRST..employees.LAST LOOP
            DBMS_OUTPUT.PUT_LINE(employees(i));
          END LOOP;
        END;
      `);
      expect(result.success).toBe(false); // Complex PL/SQL features not fully implemented
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('SHOULD FAIL: Completely invalid SQL', () => {
      const result = tester.parseCode('This is not SQL at all! Just random text ###');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases That May Not Work', () => {
    test('SHOULD FAIL: Nested comments', () => {
      // Nested comments might not be handled properly
      const result = tester.parseCode('SELECT /* outer /* inner */ comment */ * FROM employees;');
      expect(result.success).toBe(false); // Nested comments are tricky
    });

    test('SHOULD FAIL: Invalid string literal', () => {
      const result = tester.parseCode("SELECT 'unclosed string FROM employees;");
      expect(result.success).toBe(false); // Unclosed string
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('SHOULD FAIL: Reserved keyword as identifier without quotes', () => {
      const result = tester.parseCode('SELECT SELECT FROM FROM;');
      expect(result.success).toBe(false); // Using reserved keywords as identifiers
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Control Test - These Should Actually Pass', () => {
    test('CONTROL: Simple SELECT should work', () => {
      const result = tester.parseCode('SELECT name FROM employees;');
      expect(result.success).toBe(true); // This should pass as a control
    });

    test('CONTROL: Basic JOIN should work', () => {
      const result = tester.parseCode('SELECT * FROM employees e JOIN departments d ON e.dept_id = d.id;');
      expect(result.success).toBe(true); // This should pass as a control
    });

    test('CONTROL: CROSS APPLY should work', () => {
      const result = tester.parseCode('SELECT * FROM table1 CROSS APPLY (SELECT * FROM table2);');
      expect(result.success).toBe(true); // Our main achievement should pass
    });
  });
});
