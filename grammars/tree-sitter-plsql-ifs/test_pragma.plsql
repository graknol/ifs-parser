-- Test PRAGMA directives
FUNCTION test_pragma RETURN BOOLEAN IS
   PRAGMA AUTONOMOUS_TRANSACTION;
   
   -- Exception initialization
   my_exception EXCEPTION;
   PRAGMA EXCEPTION_INIT(my_exception, -20001);
   
   PRAGMA SERIALLY_REUSABLE;
   
   -- Function with restrict references
   FUNCTION pure_func(x NUMBER) RETURN NUMBER IS
   BEGIN
      PRAGMA RESTRICT_REFERENCES(pure_func, WNDS, RNDS);
      RETURN x * 2;
   END pure_func;
   
BEGIN
   PRAGMA AUTONOMOUS_TRANSACTION;
   
   -- Test cursor attributes
   CURSOR c1 IS SELECT * FROM employees;
BEGIN
   OPEN c1;
   
   IF c1%ISOPEN THEN
      NULL;
   END IF;
   
   FETCH c1 INTO v_emp;
   IF c1%FOUND THEN
      COMMIT;
   END IF;
   
   IF c1%NOTFOUND THEN
      EXIT;
   END IF;
   
   -- SQL cursor attributes
   UPDATE employees SET salary = salary * 1.1;
   IF SQL%FOUND THEN
      DBMS_OUTPUT.PUT_LINE('Updated ' || SQL%ROWCOUNT || ' rows');
   END IF;
   
   CLOSE c1;
   RETURN TRUE;
END test_pragma;
