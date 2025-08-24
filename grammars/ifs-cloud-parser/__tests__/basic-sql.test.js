const GrammarTester = require('./grammar-tester');

describe('Basic SQL Operations', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Simple SELECT statements', () => {
    test('SELECT with single column', () => {
      const result = tester.parseCode('SELECT name FROM employees;');
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Errors:', result.formatErrors(result.errors));
      }
    });

    test('SELECT with asterisk', () => {
      const result = tester.parseCode('SELECT * FROM employees;');
      expect(result.success).toBe(true);
    });

    test('SELECT with multiple columns', () => {
      const result = tester.parseCode('SELECT name, age, salary FROM employees;');
      expect(result.success).toBe(true);
    });

    test('SELECT with table alias', () => {
      const result = tester.parseCode('SELECT e.name FROM employees e;');
      expect(result.success).toBe(true);
    });

    test('SELECT with column alias', () => {
      const result = tester.parseCode('SELECT name AS employee_name FROM employees;');
      expect(result.success).toBe(true);
    });
  });

  describe('Basic clauses', () => {
    test('WHERE clause with simple condition', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary > 50000;');
      expect(result.success).toBe(true);
    });

    test('ORDER BY clause', () => {
      const result = tester.parseCode('SELECT * FROM employees ORDER BY name;');
      expect(result.success).toBe(true);
    });

    test('GROUP BY and HAVING clauses', () => {
      const result = tester.parseCode('SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5;');
      expect(result.success).toBe(true);
    });
  });

  describe('INSERT statements', () => {
    test('INSERT with values', () => {
      const result = tester.parseCode("INSERT INTO employees (name, salary) VALUES ('John', 60000);");
      expect(result.success).toBe(true);
    });

    test('INSERT with SELECT', () => {
      const result = tester.parseCode('INSERT INTO employees (name, salary) SELECT name, salary FROM temp_employees;');
      expect(result.success).toBe(true);
    });
  });

  describe('UPDATE statements', () => {
    test('Simple UPDATE', () => {
      const result = tester.parseCode("UPDATE employees SET salary = 65000 WHERE name = 'John';");
      expect(result.success).toBe(true);
    });

    test('UPDATE with multiple columns', () => {
      const result = tester.parseCode("UPDATE employees SET salary = 65000, department = 'IT' WHERE id = 1;");
      expect(result.success).toBe(true);
    });
  });

  describe('DELETE statements', () => {
    test('Simple DELETE', () => {
      const result = tester.parseCode("DELETE FROM employees WHERE name = 'John';");
      expect(result.success).toBe(true);
    });

    test('DELETE with subquery', () => {
      const result = tester.parseCode('DELETE FROM employees WHERE id IN (SELECT id FROM temp_delete);');
      expect(result.success).toBe(true);
    });
  });
});
