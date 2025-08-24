# Packages

These are iherently complex due to the nature of Oracle PL/SQL. They follow the same principle as views, in that they remove the boilerplate of having to write `CREATE PACKAGE` and `CREATE PACKAGE BODY`. The rest is 100% Oracle PL/SQL.

For the sake of simplicity, I'll refer to both procedures and functions as just "procedures" in the below rules.

It follows these rules:
- If a procedure ends in two underscores (Create_Foo__), then that means it's protected. This is exposed through the package header, but it signals to the developer that this is not meant to be directly consumed unless you know what you're doing.
- If a procedure ends in three underscores (Do_Some_Things___), then that means it's private. These are not exposed through the package header, and so it can only be called from other procedures from within that package.
- If it has no trailing underscores, then that is a regular public procedure.
- Procedures should end with `END <procedure-name>;`, although not required, it is highly recommended to do so.
- If a procedure is annotated with `@Override`, it should contain a `super(<parameter-list>);` call in its body. This is the point where the underlying layer's code gets called (just like C#'s `base.<MethodName>();` when using inheritance).
- If a procedure is annotated with `@Overtake`, then it can contain any of the following directives in both the variable declaration block and its body:
  - ```sql
    -- An example of how to put some code after specific statements in the procedure's body
    $SEARCH
    Some_Code_Here();
    that_exists_ := 'In the overtaken procedure';
    $APPEND
    this_ := 'Will come after the searched codeblock';
    $END
    ```
  - ```sql
    -- An example of how to put some variables before others in the variable declaration block
    $PREPEND
    this_will_     VARCHAR2(100) := NULL;
    come_before_   NUMBER;
    $SEARCH
    existing_part_of_variable_declaration_      BOOLEAN;
    $END
    ```
  - ```sql
    -- An example of how to completely replace some statements
    $SEARCH
    Some_API.Call_We_Do_Not_Want(1, 2, 3);
    $REPLACE
    Much_Better_API.Happy_Camper('smile to the world');
    success_ := TRUE;
    $END
    ```
  Note all 3 of these directives can be used both in the variables section and body section.

  There also exists `$TEXTSEARCH`, `$TEXTREPLACE`, `$TEXTAPPEND`, `$TEXTPREPEND` and `$TEXTEND` versions of these, which is basically the same but with different semantics in how whitespace and formatting is handled. It does **NOT** make a difference to the parser.

## ⚠️ SQL in PL/SQL

Be aware that PL/SQL can (and will) contain Oracle SQL embedded in both `CURSOR` variable declarations and as standalone statements in a procedure's body. The rules of SQL are vast and complex, but this can best be solved by a nested SQL parser and should not be mangled with the PL/SQL parser.