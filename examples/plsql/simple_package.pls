-- Simple PL/SQL package example
PACKAGE Customer_API IS

-- Constants
c_version_ CONSTANT VARCHAR2(10) := '1.0.0';

-- Exceptions
invalid_customer_ EXCEPTION;

-- Public procedures
PROCEDURE Create_Customer (
   customer_id_ IN VARCHAR2,
   name_        IN VARCHAR2,
   email_       IN VARCHAR2 DEFAULT NULL
);

PROCEDURE Update_Customer (
   customer_id_ IN VARCHAR2,
   name_        IN VARCHAR2 DEFAULT NULL,
   email_       IN VARCHAR2 DEFAULT NULL
);

FUNCTION Get_Customer_Name (
   customer_id_ IN VARCHAR2
) RETURN VARCHAR2;

END Customer_API;
/

PACKAGE BODY Customer_API IS

PROCEDURE Create_Customer (
   customer_id_ IN VARCHAR2,
   name_        IN VARCHAR2,
   email_       IN VARCHAR2 DEFAULT NULL
) IS
   rec_ Customer_Tab%ROWTYPE;
BEGIN
   -- Validate input
   IF customer_id_ IS NULL THEN
      Error_SYS.Record_General('Customer_API', 'INVALID_ID: Customer ID cannot be null');
   END IF;
   
   -- Check if customer already exists
   IF Check_Exist___(customer_id_) THEN
      Error_SYS.Record_General('Customer_API', 'CUSTOMER_EXISTS: Customer :P1 already exists', customer_id_);
   END IF;
   
   -- Create new customer record
   rec_.customer_id := customer_id_;
   rec_.name := name_;
   rec_.email := email_;
   rec_.created_date := SYSDATE;
   rec_.objversion := SYSDATE;
   
   New___(rec_);
   
   -- Log the operation
   Transaction_SYS.Log_Info_('Customer_API', 'Customer :P1 created successfully', customer_id_);
   
EXCEPTION
   WHEN OTHERS THEN
      Error_SYS.Record_General('Customer_API', 'CREATE_ERROR: Error creating customer :P1 - :P2', customer_id_, SQLERRM);
      RAISE;
END Create_Customer;

PROCEDURE Update_Customer (
   customer_id_ IN VARCHAR2,
   name_        IN VARCHAR2 DEFAULT NULL,
   email_       IN VARCHAR2 DEFAULT NULL
) IS
   rec_ Customer_Tab%ROWTYPE;
   objversion_ Customer_Tab.objversion%TYPE;
BEGIN
   -- Get current record
   Get_Id_Version_By_Keys___(objversion_, customer_id_);
   rec_ := Lock_By_Id___(customer_id_, objversion_);
   
   -- Update fields if provided
   IF name_ IS NOT NULL THEN
      rec_.name := name_;
   END IF;
   
   IF email_ IS NOT NULL THEN
      rec_.email := email_;
   END IF;
   
   rec_.modified_date := SYSDATE;
   
   Modify___(rec_);
   
END Update_Customer;

FUNCTION Get_Customer_Name (
   customer_id_ IN VARCHAR2
) RETURN VARCHAR2 IS
   name_ Customer_Tab.name%TYPE;
   CURSOR get_name IS
      SELECT name
      FROM Customer_Tab
      WHERE customer_id = customer_id_;
BEGIN
   OPEN get_name;
   FETCH get_name INTO name_;
   CLOSE get_name;
   
   RETURN name_;
EXCEPTION
   WHEN NO_DATA_FOUND THEN
      RETURN NULL;
END Get_Customer_Name;

-- Private implementation methods
FUNCTION Check_Exist___ (
   customer_id_ IN VARCHAR2
) RETURN BOOLEAN IS
   dummy_ NUMBER;
   CURSOR exist_control IS
      SELECT 1
      FROM Customer_Tab
      WHERE customer_id = customer_id_;
BEGIN
   OPEN exist_control;
   FETCH exist_control INTO dummy_;
   IF exist_control%FOUND THEN
      CLOSE exist_control;
      RETURN TRUE;
   END IF;
   CLOSE exist_control;
   RETURN FALSE;
END Check_Exist___;

END Customer_API;
/
