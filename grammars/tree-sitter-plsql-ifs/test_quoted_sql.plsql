-- Test quoted identifiers in SQL statements
FUNCTION test_quoted_sql RETURN NUMBER IS
   v_count NUMBER;
   "result value" NUMBER;
BEGIN
   -- SELECT with quoted column names and aliases
   SELECT t."some field" AS "new name",
          t."other field" "alias also",
          "some basic stuff" AS implicit,
          "other things",
          COUNT(*) AS "row count"
   FROM "foo_table" t
   WHERE t."status field" = 'ACTIVE'
     AND "other things" IS NOT NULL;
   
   -- INSERT with quoted identifiers
   INSERT INTO "my_table" ("field one", "field two", "field three")
   VALUES ('value1', 'value2', 'value3');
   
   -- UPDATE with quoted identifiers
   UPDATE "employee_table"
   SET "first name" = 'John',
       "last name" = 'Doe',
       "hire date" = SYSDATE
   WHERE "employee id" = 123;
   
   -- Schema qualified quoted identifiers
   SELECT "schema1"."table1"."column1",
          "schema2"."table2"."column2"
   FROM "schema1"."table1"
   JOIN "schema2"."table2" ON "schema1"."table1"."id" = "schema2"."table2"."ref_id";
   
   -- Mixed regular and quoted identifiers
   SELECT regular_column,
          "quoted column" AS "quoted alias",
          regular_column2 AS regular_alias,
          "quoted column2" regular_alias2
   FROM regular_table rt
   JOIN "quoted table" qt ON rt.id = qt."reference id";
   
   -- Quoted identifiers in WHERE clauses
   SELECT COUNT(*)
   INTO "result value"
   FROM employees
   WHERE "employee status" IN ('ACTIVE', 'PENDING')
     AND "department name" LIKE '%Engineering%'
     AND "hire date" BETWEEN DATE '2020-01-01' AND DATE '2023-12-31';
   
   RETURN "result value";
END test_quoted_sql;
