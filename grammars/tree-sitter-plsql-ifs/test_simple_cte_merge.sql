-- Simple CTE
WITH sales_totals AS (
  SELECT customer_id, SUM(amount) as total
  FROM orders
  WHERE order_date >= '2023-01-01'
  GROUP BY customer_id
)
SELECT customer_id, total 
FROM sales_totals
WHERE total > 1000;

-- Simple MERGE
MERGE INTO target_table t
USING source_table s
ON (t.id = s.id)
WHEN MATCHED THEN
  UPDATE SET t.value = s.value
WHEN NOT MATCHED THEN
  INSERT (id, value)
  VALUES (s.id, s.value);
