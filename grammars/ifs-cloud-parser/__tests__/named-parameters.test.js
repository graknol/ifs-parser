const GrammarTester = require('./grammar-tester');

describe('Named Parameter Syntax', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Basic named parameter calls', () => {
    test('Simple procedure call with named parameters', () => {
      const sql = `
        BEGIN
          Test_Procedure(param1 => 'value1', param2 => 42);
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Function call with named parameters', () => {
      const sql = `
        DECLARE
          result_ NUMBER;
        BEGIN
          result_ := Calculate_Value(x => 10, y => 20, operation => 'ADD');
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Mixed positional and named parameters', () => {
      const sql = `
        BEGIN
          Update_Record('123', status => 'ACTIVE', modified_by => USER);
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('Complex named parameter scenarios', () => {
    test('Multi-line procedure call with named parameters', () => {
      const sql = `
        BEGIN
          Transaction_SYS.Deferred_Call(
            procedure_name_ => 'Project_API.Update_Work_Day_to_Hrs_Conv__',
            arguments_      => attr_,
            description_    => Language_SYS.Translate_Constant(lu_name_, 'REFRESH: Refresh')
          );
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Named parameters with complex expressions', () => {
      const sql = `
        BEGIN
          Process_Data(
            id => project_id_ || '_' || TO_CHAR(SYSDATE, 'YYYYMMDD'),
            amount => ROUND(total_amount_ * 1.25, 2),
            active => (status_ = 'ACTIVE' AND validated_ = 'TRUE')
          );
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Nested function calls with named parameters', () => {
      const sql = `
        BEGIN
          Log_Message(
            message => Format_String(
              template => 'Processing record {0} at {1}',
              param1 => record_id_,
              param2 => TO_CHAR(SYSDATE, 'HH24:MI:SS')
            ),
            level => 'INFO'
          );
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('Named parameters in different contexts', () => {
    test('Named parameters in SELECT INTO', () => {
      const sql = `
        DECLARE
          result_ VARCHAR2(100);
        BEGIN
          SELECT Get_Description(id => emp_id_, lang => 'EN') 
          INTO result_
          FROM employees 
          WHERE id = 1;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Named parameters in cursor FOR loop', () => {
      const sql = `
        BEGIN
          FOR rec IN (SELECT * FROM employees WHERE Get_Status(id => emp_id) = 'ACTIVE') LOOP
            DBMS_OUTPUT.PUT_LINE(rec.name);
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

    test('Named parameters in package procedure calls', () => {
      const sql = `
        BEGIN
          Project_API.Update_Status(
            project_id_ => 'PROJ001',
            new_status_ => 'COMPLETED',
            update_date_ => SYSDATE,
            updated_by_ => USER
          );
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });
  });

  describe('Edge cases and error conditions', () => {
    test('Single named parameter', () => {
      const sql = `
        BEGIN
          Single_Param_Proc(value => 42);
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Named parameter with NULL value', () => {
      const sql = `
        BEGIN
          Test_Procedure(param1 => NULL, param2 => 'test');
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('Named parameter with quoted identifier', () => {
      const sql = `
        BEGIN
          Test_Procedure("Special Param" => 'value');
        END;
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
