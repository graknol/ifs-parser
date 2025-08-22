PROCEDURE Test_Distinct IS
  result_ NUMBER;
  customer_count_ NUMBER;
BEGIN
  -- DISTINCT in SELECT list
  SELECT DISTINCT customer_no, order_date 
  INTO result_, customer_count_
  FROM customer_order;
  
  -- COUNT with DISTINCT
  result_ := (SELECT COUNT(DISTINCT customer_no) FROM customer_order);
  
  -- COUNT with asterisk (regular count)
  result_ := (SELECT COUNT(*) FROM customer_order);
  
  -- MAX with DISTINCT (though not commonly used, should still parse)
  result_ := (SELECT MAX(DISTINCT order_value) FROM customer_order);
  
  -- Multiple DISTINCT expressions in function
  result_ := (SELECT COUNT(DISTINCT customer_no) + COUNT(DISTINCT order_no) FROM customer_order);
  
  -- Regular SELECT DISTINCT with scalar subquery
  IF (SELECT COUNT(DISTINCT state) FROM customer_order) > 1 THEN
    NULL;
  END IF;
  
END Test_Distinct;
