SELECT * FROM table1 CROSS APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);
SELECT * FROM table1 ab CROSS APPLY (SELECT * FROM table2 WHERE table2.id = table1.id);
