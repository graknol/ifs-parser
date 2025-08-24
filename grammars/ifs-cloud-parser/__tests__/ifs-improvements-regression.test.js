const GrammarTester = require('./grammar-tester');

describe('IFS Cloud Parser Improvements - Regression Tests', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  describe('@Override Annotations', () => {
    test('Procedure with @Override annotation', () => {
      const code = `
        @Override
        PROCEDURE Finite_State_Set___ (
          rec_   IN OUT activity_tab%ROWTYPE,
          state_ IN     VARCHAR2 
        )
        IS
        BEGIN
          super(rec_, state_);
          NULL;
        END Finite_State_Set___;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Function with @Override annotation', () => {
      const code = `
        @Override
        FUNCTION Get_State___ RETURN VARCHAR2
        IS
        BEGIN
          RETURN super();
        END Get_State___;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Multiple annotations on procedure', () => {
      const code = `
        @Override
        @DatabaseDefault
        PROCEDURE Update_Record___ (
          rec_ IN OUT customer_tab%ROWTYPE
        )
        IS
        BEGIN
          NULL;
        END Update_Record___;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Annotation on statement within procedure body', () => {
      const code = `
        PROCEDURE Test_Proc
        IS
        BEGIN
          @ApiCall
          Customer_API.Modify(rec_);
          
          @Override
          IF condition_ THEN
            NULL;
          END IF;
        END Test_Proc;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('NOCOPY Parameter Modifiers', () => {
    test('NOCOPY with IN OUT parameter', () => {
      const code = `
        PROCEDURE Process_Large_Data (
          data_ IN OUT NOCOPY CLOB,
          result_ OUT NOCOPY VARCHAR2
        )
        IS
        BEGIN
          NULL;
        END Process_Large_Data;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('NOCOPY with OUT parameter', () => {
      const code = `
        PROCEDURE Get_Large_Result (
          id_ IN NUMBER,
          result_ OUT NOCOPY XMLType
        )
        IS
        BEGIN
          NULL;
        END Get_Large_Result;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Mixed parameters with and without NOCOPY', () => {
      const code = `
        PROCEDURE Mixed_Params (
          small_param_ IN VARCHAR2,
          large_data_ IN OUT NOCOPY CLOB,
          normal_out_ OUT NUMBER,
          large_out_ OUT NOCOPY XMLType
        )
        IS
        BEGIN
          NULL;
        END Mixed_Params;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Qualified Wildcards (table.*)', () => {
    test('Table wildcard in SELECT statement', () => {
      const code = `
        DECLARE
          CURSOR c1 IS
            SELECT p.*, c.customer_name
            FROM project_tab p, customer_tab c
            WHERE p.customer_id = c.customer_id;
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Multiple qualified wildcards', () => {
      const code = `
        DECLARE
          CURSOR activity_cursor IS
            SELECT a.*, p.*, c.customer_name
            FROM activity_tab a, project_tab p, customer_tab c
            WHERE a.project_id = p.project_id
              AND p.customer_id = c.customer_id;
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Qualified wildcard with alias', () => {
      const code = `
        DECLARE
          CURSOR test_cursor IS
            SELECT proj.*, act.activity_seq, act.description
            FROM project_tab proj
            JOIN activity_tab act ON proj.project_id = act.project_id;
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Cursor RETURN Type Declarations', () => {
    test('Cursor with RETURN %ROWTYPE', () => {
      const code = `
        DECLARE
          CURSOR emp_cursor RETURN employees%ROWTYPE IS
            SELECT * FROM employees WHERE department_id = 10;
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Cursor with RETURN record type', () => {
      const code = `
        DECLARE
          TYPE emp_record IS RECORD (
            emp_id NUMBER,
            emp_name VARCHAR2(100),
            salary NUMBER
          );
          
          CURSOR emp_cursor RETURN emp_record IS
            SELECT employee_id, first_name, salary 
            FROM employees;
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('REF CURSOR with RETURN type', () => {
      const code = `
        DECLARE
          TYPE emp_cursor_type IS REF CURSOR RETURN employees%ROWTYPE;
          emp_cursor emp_cursor_type;
        BEGIN
          OPEN emp_cursor FOR SELECT * FROM employees;
          CLOSE emp_cursor;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Enhanced Hierarchical Queries', () => {
    test('START WITH followed by CONNECT BY', () => {
      const code = `
        DECLARE
          CURSOR hierarchy_cursor IS
            SELECT employee_id, manager_id, LEVEL
            FROM employees
            START WITH manager_id IS NULL
            CONNECT BY PRIOR employee_id = manager_id
            ORDER BY LEVEL, employee_id;
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('CONNECT BY followed by START WITH', () => {
      const code = `
        DECLARE
          CURSOR hierarchy_cursor IS
            SELECT project_id, parent_project_id, LEVEL
            FROM project_hierarchy_tab
            CONNECT BY PRIOR project_id = parent_project_id
            START WITH parent_project_id IS NULL;
        BEGIN
          NULL;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Hierarchical query with complex conditions', () => {
      const code = `
        SELECT activity_seq, project_id, parent_activity_seq, LEVEL,
               SYS_CONNECT_BY_PATH(description, '/') AS path
        FROM activity_tab
        WHERE status = 'Active'
        START WITH parent_activity_seq IS NULL
        CONNECT BY PRIOR activity_seq = parent_activity_seq
               AND LEVEL <= 5
        ORDER SIBLINGS BY description;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });
  });

  describe('Complex EXISTS Expressions Regression', () => {
    test('EXISTS with multi-table subquery (from Activity.plsql)', () => {
      const code = `
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
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });

    test('Nested EXISTS expressions', () => {
      const code = `
        BEGIN
          IF EXISTS (
            SELECT 1 FROM project_tab p
            WHERE p.status = 'Active'
              AND EXISTS (
                SELECT 1 FROM activity_tab a
                WHERE a.project_id = p.project_id
                  AND a.status = 'Started'
              )
          ) THEN
            NULL;
          END IF;
        END;
      `;
      const result = tester.parseCode(code);
      expect(result.hasErrors).toBe(false);
    });
  });
});
