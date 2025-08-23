const GrammarTester = require('./grammar-tester');

describe('Record Type Declarations', () => {
  let tester;

  beforeAll(() => {
    tester = new GrammarTester();
  });

  afterAll(() => {
    if (tester) {
      tester.cleanup();
    }
  });

  describe('Basic record type declarations', () => {
    test('simple record type', () => {
      const sql = `
        DECLARE
          TYPE employee_rec IS RECORD (
            id NUMBER,
            name VARCHAR2(100),
            salary NUMBER(10,2)
          );
          emp employee_rec;
        BEGIN
          emp.id := 1;
          emp.name := 'John Doe';
          emp.salary := 50000.00;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('record type with default values', () => {
      const sql = `
        DECLARE
          TYPE address_rec IS RECORD (
            street VARCHAR2(100),
            city VARCHAR2(50),
            country VARCHAR2(50) := 'USA',
            zip NUMBER(5)
          );
          addr address_rec;
        BEGIN
          addr.street := '123 Main St';
          addr.city := 'Anytown';
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('nested record types', () => {
      const sql = `
        DECLARE
          TYPE address_rec IS RECORD (
            street VARCHAR2(100),
            city VARCHAR2(50),
            country VARCHAR2(50),
            zip NUMBER(5)
          );
          
          TYPE person_rec IS RECORD (
            id NUMBER,
            name VARCHAR2(100),
            address address_rec,
            hire_date DATE := SYSDATE
          );
          
          employee person_rec;
        BEGIN
          employee.id := 1;
          employee.name := 'John Doe';
          employee.address.street := '123 Main St';
          employee.address.city := 'Anytown';
          employee.hire_date := SYSDATE;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('record field assignment operations', () => {
      const sql = `
        DECLARE
          TYPE emp_rec IS RECORD (
            id NUMBER,
            name VARCHAR2(100),
            salary NUMBER(10,2),
            bonus NUMBER(10,2) := 0
          );
          employee emp_rec;
          temp_employee emp_rec;
        BEGIN
          -- Basic assignments
          employee.id := 100;
          employee.name := 'Jane Smith';
          employee.salary := 75000;
          
          -- Record to record assignment
          temp_employee := employee;
          
          -- Field calculations
          employee.bonus := employee.salary * 0.1;
          
          -- Conditional assignment
          IF employee.salary > 50000 THEN
            employee.bonus := employee.salary * 0.15;
          END IF;
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

  describe('Advanced record type scenarios', () => {
    test('record type in procedure parameters', () => {
      const sql = `
        DECLARE
          TYPE employee_rec IS RECORD (
            id NUMBER,
            name VARCHAR2(100),
            department VARCHAR2(50)
          );
          
          PROCEDURE process_employee(emp IN OUT employee_rec) IS
          BEGIN
            emp.department := UPPER(emp.department);
            Log_Employee_Update(emp.id, emp.name);
          END process_employee;
          
          my_employee employee_rec;
        BEGIN
          my_employee.id := 1;
          my_employee.name := 'John Doe';
          my_employee.department := 'engineering';
          
          process_employee(my_employee);
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('record type in function return', () => {
      const sql = `
        DECLARE
          TYPE contact_rec IS RECORD (
            email VARCHAR2(100),
            phone VARCHAR2(20),
            address VARCHAR2(200)
          );
          
          FUNCTION get_contact_info(emp_id NUMBER) RETURN contact_rec IS
            contact contact_rec;
          BEGIN
            SELECT email, phone, address 
            INTO contact.email, contact.phone, contact.address
            FROM employee_contacts 
            WHERE employee_id = emp_id;
            
            RETURN contact;
          END get_contact_info;
          
          employee_contact contact_rec;
        BEGIN
          employee_contact := get_contact_info(100);
          DBMS_OUTPUT.PUT_LINE('Email: ' || employee_contact.email);
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('record type with %TYPE and %ROWTYPE references', () => {
      const sql = `
        DECLARE
          TYPE mixed_rec IS RECORD (
            emp_id employees.employee_id%TYPE,
            emp_name employees.first_name%TYPE,
            full_employee employees%ROWTYPE,
            created_date DATE := SYSDATE
          );
          
          employee_data mixed_rec;
        BEGIN
          SELECT employee_id, first_name 
          INTO employee_data.emp_id, employee_data.emp_name
          FROM employees 
          WHERE employee_id = 100;
          
          SELECT * 
          INTO employee_data.full_employee
          FROM employees 
          WHERE employee_id = employee_data.emp_id;
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('record arrays and collections', () => {
      const sql = `
        DECLARE
          TYPE employee_rec IS RECORD (
            id NUMBER,
            name VARCHAR2(100),
            salary NUMBER
          );
          
          TYPE employee_array IS TABLE OF employee_rec INDEX BY BINARY_INTEGER;
          
          employees employee_array;
          temp_emp employee_rec;
        BEGIN
          -- Initialize array elements
          temp_emp.id := 1;
          temp_emp.name := 'John';
          temp_emp.salary := 50000;
          employees(1) := temp_emp;
          
          temp_emp.id := 2;
          temp_emp.name := 'Jane';
          temp_emp.salary := 60000;
          employees(2) := temp_emp;
          
          -- Access array elements
          FOR i IN 1..2 LOOP
            DBMS_OUTPUT.PUT_LINE('Employee: ' || employees(i).name || 
                               ', Salary: ' || employees(i).salary);
          END LOOP;
        END;
      `;

      const result = tester.parseCode(sql);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
      expect(result.success).toBe(true);
    });
  });

  describe('Real-world IFS-style record usage', () => {
    test('IFS-style record with underscores', () => {
      const sql = `
        DECLARE
          TYPE project_rec IS RECORD (
            project_id_ VARCHAR2(20),
            project_name_ VARCHAR2(100),
            start_date_ DATE,
            end_date_ DATE,
            status_ VARCHAR2(20) := 'ACTIVE'
          );
          
          current_project_ project_rec;
        BEGIN
          current_project_.project_id_ := 'PROJ_001';
          current_project_.project_name_ := 'IFS Cloud Enhancement';
          current_project_.start_date_ := SYSDATE;
          current_project_.end_date_ := SYSDATE + 365;
          
          Project_API.Create_Project(current_project_);
        END;
      `;

      const result = tester.parseCode(sql);
      expect(result.success).toBe(true);
      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('AST:', result.ast);
      }
    });

    test('complex nested record structures', () => {
      const sql = `
        PROCEDURE Process_Activities IS
          TYPE activity_detail_rec IS RECORD (
            activity_seq NUMBER,
            activity_no VARCHAR2(20),
            description VARCHAR2(2000),
            status VARCHAR2(20)
          );
          
          TYPE project_summary_rec IS RECORD (
            project_id VARCHAR2(20),
            project_name VARCHAR2(100),
            total_activities NUMBER,
            current_activity activity_detail_rec
          );
          
          project_info_ project_summary_rec;
        BEGIN
          -- Initialize project info
          project_info_.project_id := Get_Current_Project_Id();
          project_info_.project_name := Get_Project_Name(project_info_.project_id);
          project_info_.total_activities := Count_Activities(project_info_.project_id);
          
          -- Get current activity details
          SELECT activity_seq, activity_no, description, status
          INTO project_info_.current_activity.activity_seq,
               project_info_.current_activity.activity_no,
               project_info_.current_activity.description,
               project_info_.current_activity.status
          FROM activity
          WHERE project_id = project_info_.project_id
          AND status = 'IN_PROGRESS'
          AND ROWNUM = 1;
          
          -- Process the activity
          Activity_API.Update_Status(
            project_info_.current_activity.activity_seq,
            'COMPLETED'
          );
        END Process_Activities;
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
