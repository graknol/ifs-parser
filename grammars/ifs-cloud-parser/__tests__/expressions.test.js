const GrammarTester = require('./grammar-tester');

describe('Expressions and Operators', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('Arithmetic expressions', () => {
    test('Simple addition', () => {
      const result = tester.parseCode('SELECT 1 + 2 FROM dual;');
      expect(result.hasErrors).toBe(false);
    });

    test('Complex arithmetic with operator precedence', () => {
      const result = tester.parseCode('SELECT 1 + 2 * 3 - 4 / 2 FROM dual;');
      expect(result.hasErrors).toBe(false);
    });

    test('Arithmetic with parentheses', () => {
      const result = tester.parseCode('SELECT (1 + 2) * (3 - 4) / 2 FROM dual;');
      expect(result.hasErrors).toBe(false);
    });

    test('Modulo operator', () => {
      const result = tester.parseCode('SELECT 10 % 3 FROM dual;');
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('String operations', () => {
    test('String concatenation', () => {
      const result = tester.parseCode("SELECT 'Hello' || ' ' || 'World' FROM dual;");
      expect(result.hasErrors).toBe(false);
    });

    test('String with single quotes', () => {
      const result = tester.parseCode("SELECT 'It''s a test' FROM dual;");
      expect(result.hasErrors).toBe(false);
    });

    test('LIKE operator', () => {
      const result = tester.parseCode("SELECT * FROM employees WHERE name LIKE 'John%';");
      expect(result.hasErrors).toBe(false);
    });

    test('LIKE with ESCAPE', () => {
      const result = tester.parseCode("SELECT * FROM employees WHERE name LIKE 'John\\_%' ESCAPE '\\';");
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Comparison operators', () => {
    test('Equality operators', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary = 50000;');
      expect(result.hasErrors).toBe(false);
    });

    test('Inequality operators', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary != 50000;');
      expect(result.hasErrors).toBe(false);
    });

    test('Alternative inequality operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary <> 50000;');
      expect(result.hasErrors).toBe(false);
    });

    test('Comparison operators', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary >= 50000 AND age < 65;');
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Logical operators', () => {
    test('AND operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary > 50000 AND department = 1;');
      expect(result.hasErrors).toBe(false);
    });

    test('OR operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary > 80000 OR department = 2;');
      expect(result.hasErrors).toBe(false);
    });

    test('NOT operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE NOT (salary < 30000);');
      expect(result.hasErrors).toBe(false);
    });

    test('Complex logical expression', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE (salary > 50000 AND department = 1) OR (salary > 80000 AND department = 2);');
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Special operators', () => {
    test('IN operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE department IN (1, 2, 3);');
      expect(result.hasErrors).toBe(false);
    });

    test('NOT IN operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE department NOT IN (4, 5, 6);');
      expect(result.hasErrors).toBe(false);
    });

    test('BETWEEN operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE salary BETWEEN 40000 AND 80000;');
      expect(result.hasErrors).toBe(false);
    });

    test('IS NULL operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE middle_name IS NULL;');
      expect(result.hasErrors).toBe(false);
    });

    test('IS NOT NULL operator', () => {
      const result = tester.parseCode('SELECT * FROM employees WHERE middle_name IS NOT NULL;');
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Function calls', () => {
    test('Simple function call', () => {
      const result = tester.parseCode('SELECT UPPER(name) FROM employees;');
      expect(result.hasErrors).toBe(false);
    });

    test('Function with multiple arguments', () => {
      const result = tester.parseCode("SELECT SUBSTR(name, 1, 3) FROM employees;");
      expect(result.hasErrors).toBe(false);
    });

    test('Nested function calls', () => {
      const result = tester.parseCode('SELECT UPPER(TRIM(name)) FROM employees;');
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('CASE expressions', () => {
    test('Simple CASE expression', () => {
      const result = tester.parseCode(`
        SELECT 
          CASE department 
            WHEN 1 THEN 'Sales' 
            WHEN 2 THEN 'Marketing' 
            ELSE 'Other' 
          END 
        FROM employees;
      `);
      expect(result.hasErrors).toBe(false);
    });

    test('Searched CASE expression', () => {
      const result = tester.parseCode(`
        SELECT 
          CASE 
            WHEN salary > 80000 THEN 'High' 
            WHEN salary > 50000 THEN 'Medium' 
            ELSE 'Low' 
          END 
        FROM employees;
      `);
      expect(result.hasErrors).toBe(false);
    });
  });
});
