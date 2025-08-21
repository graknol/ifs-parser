# Views

Now we're moving into more complex territory. Views are Oracle SQL based, but you don't see any `CREATE VIEW <name> AS ...` statements in these files.
These files reduce the creation of views to the absolute minimum boilerplate required.

They can also contain special column definitions. These are either supplied outside of the view as a `COLUMN <name> IS ...` block.
Or inline in the view between the `VIEW <name> IS` and `SELECT` lines.
These properties are normally fetched from the related entity's definition.
But, sometimes that is impossible to detect or doesn't get detected, thus we need to supply them.
Other times we need to override some of them, for whatever reason.
