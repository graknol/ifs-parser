const GrammarTester = require('./grammar-tester');

describe('Conditional Compilation Directives', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Basic conditional compilation', () => {
    test('simple conditional compilation', () => {
      const sql = `
        BEGIN
           $IF (Component_Test_SYS.INSTALLED) $THEN
              Test_API.Do_Something();
           $END
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('conditional compilation with ELSE', () => {
      const sql = `
        BEGIN
           $IF (Component_Docman_SYS.INSTALLED) $THEN
              Doc_Package_Id_API.Copy_Document_Packages (actv_.activity_seq, new_act_seq_);
           $ELSE
              NULL;
           $END
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('nested conditional compilation', () => {
      const sql = `
        BEGIN
           $IF (Component_Base_SYS.INSTALLED) $THEN
              Base_API.Do_Base_Operation();
              $IF (Component_Advanced_SYS.INSTALLED) $THEN
                 Advanced_API.Do_Advanced_Operation();
              $ELSE
                 Standard_API.Do_Standard_Operation();
              $END
           $ELSE
              Error_SYS.Record_General('Activity', 'NOBASECOMPONENT: Base component not installed.');
           $END
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('conditional compilation in procedure', () => {
      const sql = `
        PROCEDURE Copy_Activity IS
           copy_or_not_ VARCHAR2(3);
        BEGIN
           copy_or_not_ := Client_SYS.Get_Item_Value('DOCPACK', options_attr_);
           IF (copy_or_not_ IS NULL OR upper(copy_or_not_) = 'YES') THEN
              $IF (Component_Docman_SYS.INSTALLED) $THEN
                 Doc_Package_Id_API.Copy_Document_Packages (actv_.activity_seq, new_act_seq_);
              $ELSE
                 NULL;
              $END
           END IF;
        END Copy_Activity;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('conditional compilation with complex conditions', () => {
      const sql = `
        BEGIN
           $IF (Component_Test_SYS.INSTALLED AND Component_Base_SYS.VERSION >= '22.2.0') $THEN
              Test_Base_Integration_API.Execute();
           $ELSE
              $IF (Component_Test_SYS.INSTALLED) $THEN
                 Test_API.Execute_Legacy();
              $END
           $END
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

  describe('Advanced conditional compilation', () => {
    test('conditional compilation in function', () => {
      const sql = `
        FUNCTION Get_Component_Info RETURN VARCHAR2 IS
           result_ VARCHAR2(100);
        BEGIN
           $IF (Component_Info_SYS.INSTALLED) $THEN
              result_ := Component_Info_API.Get_Version();
           $ELSE
              result_ := 'COMPONENT_NOT_INSTALLED';
           $END
           RETURN result_;
        END Get_Component_Info;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('conditional compilation with package calls', () => {
      const sql = `
        BEGIN
           -- Initialize resources
           $IF (Component_Resource_SYS.INSTALLED) $THEN
              Resource_Manager_API.Initialize_Resources(project_id_);
              $IF (Component_Resource_Planning_SYS.INSTALLED) $THEN
                 Resource_Planning_API.Create_Default_Plan(project_id_);
              $END
           $ELSE
              Basic_Resource_API.Initialize(project_id_);
           $END
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('conditional compilation with multiple statements', () => {
      const sql = `
        BEGIN
           $IF (Component_Advanced_SYS.INSTALLED) $THEN
              -- Multiple statements in conditional block
              Advanced_Logger_API.Log_Info('Starting advanced processing');
              Advanced_Processor_API.Process_Data(input_data_);
              Advanced_Validator_API.Validate_Results(result_data_);
              Advanced_Logger_API.Log_Info('Advanced processing completed');
           $ELSE
              -- Fallback statements
              Standard_Logger_API.Log('Starting standard processing');
              Standard_Processor_API.Process(input_data_);
           $END
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

  describe('Complex conditional compilation scenarios', () => {
    test('conditional compilation in package body', () => {
      const sql = `
        PACKAGE BODY Test_Package IS

        FUNCTION Check_Component RETURN BOOLEAN IS
        BEGIN
           $IF (Component_Check_SYS.INSTALLED) $THEN
              RETURN TRUE;
           $ELSE
              RETURN FALSE;
           $END
        END Check_Component;

        PROCEDURE Execute_Task IS
        BEGIN
           $IF (Component_Task_SYS.INSTALLED) $THEN
              Task_API.Execute();
           $END
        END Execute_Task;

        END Test_Package;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('conditional compilation with declarations', () => {
      const sql = `
        DECLARE
           $IF (Component_Advanced_SYS.INSTALLED) $THEN
              advanced_mode_ BOOLEAN := TRUE;
           $ELSE
              standard_mode_ BOOLEAN := TRUE;
           $END
        BEGIN
           $IF (Component_Advanced_SYS.INSTALLED) $THEN
              IF advanced_mode_ THEN
                 Advanced_API.Execute();
              END IF;
           $ELSE
              IF standard_mode_ THEN
                 Standard_API.Execute();
              END IF;
           $END
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('conditional compilation with constants', () => {
      const sql = `
        DECLARE
           $IF (Component_Config_SYS.INSTALLED) $THEN
              c_max_retries CONSTANT INTEGER := 10;
           $ELSE
              c_max_retries CONSTANT INTEGER := 3;
           $END
           retry_count_ INTEGER := 0;
        BEGIN
           WHILE retry_count_ < c_max_retries LOOP
              -- Retry logic here
              retry_count_ := retry_count_ + 1;
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

    test('conditional compilation with pragma', () => {
      const sql = `
        PROCEDURE Test_Proc IS
           $IF (Component_Debug_SYS.INSTALLED) $THEN
              PRAGMA AUTONOMOUS_TRANSACTION;
           $END
        BEGIN
           $IF (Component_Debug_SYS.INSTALLED) $THEN
              Debug_API.Log_Entry('Test_Proc');
           $END
           
           -- Procedure logic here
           
           $IF (Component_Debug_SYS.INSTALLED) $THEN
              Debug_API.Log_Exit('Test_Proc');
              COMMIT;
           $END
        END Test_Proc;
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
