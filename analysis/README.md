# Analysis

The files in these directories are examples of what the different file types may contain.
They are accompanied with an explanation of the most important aspects.

## Override and Overtake

In IFS Cloud development, we have 3 layers:

1. Base layer
  - This is what IFS build-tooling generates under-the-hood (base views, common package methods, etc...)
2. Core layer
  - This is where IFS R&D is building the core IFS application
3. Cust layer
  - This is where customers can add their customizations

Each layer can either supply new Logical Units (LU), which is basically just a grouping of different file types (for example: Activity.entity, Activity.plsql, Activity.views, Activity.storage).

Or, it can `@Override` the layers below it:
- For procedures and functions, this means wrapping the underlying one with a new one and then we can add statements before and after it with a `super()` call in the middle. Kind of how inheritance works in other languages.
- For views it means adding more columns to the underlying view's `SELECT` statement (but not modifying existing ones!) or more conditions to its `WHERE` clause (these get `AND`'ed together, so you can't change the underlying view's conditions, only supply more aggressive filtering).

This may not be enough, so you can also `@Overtake` it. In all cases this completely replaces the underlying implementation, and you have to supply the entire implementation yourself. (Which also means more work to upgrade to a newer version when the Core layer updates).

## String literals

One important aspect of the parser is that when writing string literals in Oracle PL/SQL, to escape a single quote (which is the delimiter), you write `''`.

Example: `hello_ := 'World isn''t a new concept!';`

This assigns `World isn't a new concept!` to the variable `hello_`.