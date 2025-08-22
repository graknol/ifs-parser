PROCEDURE Test_Scalar_Subquery IS
  result_ NUMBER;
  customer_count_ NUMBER;
BEGIN
  -- Simple scalar subquery assignment
  result_ := (SELECT COUNT(*) FROM customer_order);
  
  -- Scalar subquery in IF condition
  IF (SELECT COUNT(*) FROM customer_order WHERE state = 'Released') > 0 THEN
    NULL;
  END IF;
  
  -- Scalar subquery in complex expression
  customer_count_ := 100 + (SELECT COUNT(*) FROM customer_order WHERE customer_no = 'CUST001');
  
  -- Nested scalar subqueries
  result_ := (SELECT MAX(order_value) FROM customer_order WHERE customer_no = 
    (SELECT customer_no FROM customer WHERE name = 'Test Customer'));
    
END Test_Scalar_Subquery;
