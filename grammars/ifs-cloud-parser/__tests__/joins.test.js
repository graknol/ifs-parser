const GrammarTester = require('./grammar-tester');

describe('JOIN Operations', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Implicit JOINs', () => {
    test('Implicit JOIN with comma syntax', () => {
      const result = tester.parseCode('SELECT * FROM employees, departments WHERE employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('Implicit JOIN with multiple tables', () => {
      const result = tester.parseCode('SELECT * FROM employees, departments, locations WHERE employees.dept_id = departments.id AND departments.loc_id = locations.id;');
      expect(result.success).toBe(true);
    });
  });

  describe('Explicit JOINs', () => {
    test('INNER JOIN', () => {
      const result = tester.parseCode('SELECT * FROM employees INNER JOIN departments ON employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('Simple JOIN (equivalent to INNER JOIN)', () => {
      const result = tester.parseCode('SELECT * FROM employees JOIN departments ON employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('LEFT OUTER JOIN', () => {
      const result = tester.parseCode('SELECT * FROM employees LEFT OUTER JOIN departments ON employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('LEFT JOIN (short form)', () => {
      const result = tester.parseCode('SELECT * FROM employees LEFT JOIN departments ON employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('RIGHT OUTER JOIN', () => {
      const result = tester.parseCode('SELECT * FROM employees RIGHT OUTER JOIN departments ON employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('RIGHT JOIN (short form)', () => {
      const result = tester.parseCode('SELECT * FROM employees RIGHT JOIN departments ON employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('FULL OUTER JOIN', () => {
      const result = tester.parseCode('SELECT * FROM employees FULL OUTER JOIN departments ON employees.dept_id = departments.id;');
      expect(result.success).toBe(true);
    });

    test('CROSS JOIN', () => {
      const result = tester.parseCode('SELECT * FROM employees CROSS JOIN departments;');
      expect(result.success).toBe(true);
    });
  });

  describe('Multiple JOINs', () => {
    test('Multiple JOIN operations', () => {
      const result = tester.parseCode(`
        SELECT * FROM employees e 
        INNER JOIN departments d ON e.dept_id = d.id 
        LEFT JOIN locations l ON d.loc_id = l.id;
      `);
      expect(result.success).toBe(true);
    });

    test('Complex multiple JOINs with aliases', () => {
      const result = tester.parseCode(`
        SELECT e.name, d.name as dept_name, l.city 
        FROM employees e 
        INNER JOIN departments d ON e.dept_id = d.id 
        LEFT OUTER JOIN locations l ON d.loc_id = l.id 
        RIGHT JOIN managers m ON e.manager_id = m.id;
      `);
      expect(result.success).toBe(true);
    });
  });

  describe('APPLY Operations (Oracle SQL Server compatibility)', () => {
    test('CROSS APPLY with subquery', () => {
      const result = tester.parseCode(`
        SELECT * FROM departments d 
        CROSS APPLY (SELECT * FROM employees e WHERE e.dept_id = d.id);
      `);
      expect(result.success).toBe(true);
    });

    test('OUTER APPLY with subquery', () => {
      const result = tester.parseCode(`
        SELECT * FROM departments d 
        OUTER APPLY (SELECT * FROM employees e WHERE e.dept_id = d.id);
      `);
      expect(result.success).toBe(true);
    });

    test('CROSS APPLY with alias', () => {
      const result = tester.parseCode(`
        SELECT * FROM departments d 
        CROSS APPLY (SELECT * FROM employees e WHERE e.dept_id = d.id) emp;
      `);
      expect(result.success).toBe(true);
    });

    test('OUTER APPLY with alias', () => {
      const result = tester.parseCode(`
        SELECT * FROM departments d 
        OUTER APPLY (SELECT * FROM employees e WHERE e.dept_id = d.id) emp;
      `);
      expect(result.success).toBe(true);
    });

    test('CROSS APPLY without alias (critical test)', () => {
      const result = tester.parseCode('SELECT * FROM table1 CROSS APPLY (SELECT * FROM table2);');
      expect(result.success).toBe(true);
    });
  });
});
