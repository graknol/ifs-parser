-- Test case-insensitive keywords  
with sales_totals as (
  select customer_id, sum(amount) as total
  from orders
  where order_date >= '2023-01-01'
  group by customer_id
)
select customer_id, total 
from sales_totals
where total > 1000;

-- MERGE with mixed case
merge into target_table t
using source_table s
on (t.id = s.id)
when matched then
  update set t.value = s.value
when not matched then
  insert (id, value)
  values (s.id, s.value);
