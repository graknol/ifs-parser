const GrammarTester = require('./grammar-tester');

describe('EXISTS expressions and subqueries', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('Basic EXISTS syntax', () => {
    test('EXISTS with simple subquery', () => {
      const sql = `
        BEGIN
          IF EXISTS (SELECT 1 FROM users WHERE active = 1) THEN
            NULL;
          END IF;
        END;
      `;
      const result = tester.parseCode(sql);
      expect(result.hasErrors).toBe(false);
    });

    test('NOT EXISTS with simple subquery', () => {
      const sql = `
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM users WHERE active = 1) THEN
            NULL;
          END IF;
        END;
      `;
      const result = tester.parseCode(sql);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('EXISTS with complex subqueries', () => {
    test('EXISTS with multi-table FROM clause', () => {
      const sql = `
        DECLARE
          CURSOR test_cursor IS
            SELECT project_id
            FROM project_tab p
            WHERE EXISTS (
              SELECT 1
              FROM proj_c_cost_el_code_p_dem_tab pccecp, 
                   project_cost_element_tab pce
              WHERE pccecp.project_id = p.project_id
                AND pce.project_id = pccecp.project_id
                AND pce.cost_element_id = pccecp.cost_element_id
            );
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(sql);
      expect(result.hasErrors).toBe(false);
    });

    test('EXISTS with JOIN syntax', () => {
      const sql = `
        BEGIN
          IF EXISTS (
            SELECT 1 
            FROM users u 
            JOIN orders o ON u.id = o.user_id 
            WHERE u.active = 1
          ) THEN
            NULL;
          END IF;
        END;
      `;
      const result = tester.parseCode(sql);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('EXISTS in different contexts', () => {
    test('EXISTS in WHERE clause', () => {
      const sql = `
        BEGIN
          FOR rec IN (
            SELECT * 
            FROM orders o
            WHERE EXISTS (SELECT 1 FROM customers c WHERE c.id = o.customer_id)
          ) LOOP
            NULL;
          END LOOP;
        END;
      `;
      const result = tester.parseCode(sql);
      expect(result.hasErrors).toBe(false);
    });

    test('Multiple EXISTS in same query', () => {
      const sql = `
        DECLARE
          CURSOR c IS
            SELECT *
            FROM orders o
            WHERE EXISTS (SELECT 1 FROM customers c WHERE c.id = o.customer_id)
              AND NOT EXISTS (SELECT 1 FROM refunds r WHERE r.order_id = o.id);
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(sql);
      expect(result.hasErrors).toBe(false);
    });

    test('EXISTS with complex subquery conditions', () => {
      const sql = `
        DECLARE
          CURSOR test_cursor IS
            SELECT project_id
            FROM project_tab p
            WHERE NOT EXISTS (
              SELECT 1
              FROM proj_c_cost_el_code_p_dem_tab pccecp, 
                   project_cost_element_tab pce,
                   another_table at
              WHERE pccecp.project_id = p.project_id
                AND pce.project_id = pccecp.project_id
                AND pce.cost_element_id = pccecp.cost_element_id
                AND at.id = pce.element_id
                AND at.active = 'Y'
            );
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(sql);
      expect(result.hasErrors).toBe(false);
    });
  });
});
