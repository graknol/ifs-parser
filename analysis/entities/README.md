# Entities

Entity files look like "Activity.txt" to a developer, but is stored in the file like "Activity.entity".
This gives the developer an easy way to define new entity fields (table columns), and how that entity (table) relates to other entities (references).
They can also define a state machine (but not all entities do this). The developer can define which states are available, and which states can transition to other states.
At the top of the entity file the developer can define extra code generation options, but these are mostly not used (only occasionally).

The important parts are the name of the entity, and the name, types and properties of the fields (insertable, required, modifiable, part of primary key, public, private, etc...)
