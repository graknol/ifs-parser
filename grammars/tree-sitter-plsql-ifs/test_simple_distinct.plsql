PROCEDURE Simple_Test IS
  result_ NUMBER;
BEGIN
  -- Simple DISTINCT in SELECT
  result_ := (SELECT COUNT(DISTINCT customer_no) FROM customer_order);
END Simple_Test;
