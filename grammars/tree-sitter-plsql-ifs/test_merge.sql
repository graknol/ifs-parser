-- MERGE statement examples
MERGE INTO employees_target t
USING employees_source s
ON (t.employee_id = s.employee_id)
WHEN MATCHED THEN
  UPDATE SET 
    t.salary = s.salary,
    t.department_id = s.department_id
WHEN NOT MATCHED THEN
  INSERT (employee_id, first_name, last_name, salary, department_id)
  VALUES (s.employee_id, s.first_name, s.last_name, s.salary, s.department_id);

-- MERGE with conditional clauses
MERGE INTO inventory inv
USING (
  SELECT product_id, quantity_received
  FROM shipments
  WHERE shipment_date = SYSDATE
) ship
ON (inv.product_id = ship.product_id)
WHEN MATCHED AND ship.quantity_received > 0 THEN
  UPDATE SET inv.quantity = inv.quantity + ship.quantity_received
WHEN MATCHED AND ship.quantity_received = 0 THEN
  DELETE
WHEN NOT MATCHED AND ship.quantity_received > 0 THEN
  INSERT (product_id, quantity)
  VALUES (ship.product_id, ship.quantity_received);

-- MERGE with table aliases
MERGE INTO customer_summary cs
USING customer_orders co AS source_alias
ON (cs.customer_id = co.customer_id)
WHEN MATCHED THEN
  UPDATE SET 
    cs.total_orders = cs.total_orders + 1,
    cs.last_order_date = co.order_date
WHEN NOT MATCHED THEN
  INSERT (customer_id, total_orders, last_order_date)
  VALUES (co.customer_id, 1, co.order_date);
