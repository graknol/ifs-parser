# Requirements

The ultimate goal of this project, is to create a parser that's able to parse IFS Cloud's source code, which consists of these languages:

- A variant of Oracle's PL/SQL (syntactic sugar on top. It is roughly the same as pure PL/SQL)
- XML based table definition language (these are called entities)
- XML based enumeration definition language (these are called enumerations)
- A variant of Oracle's SQL (syntactic sugar on top. It is roughly the same as pure SQL) for creating database views
- A custom language for defining OData v4 endpoints called projections. The language is called Marble and is a custom DSL made by IFS
- A custom language for defining frontend client layout and behaviour. The language is called Marble and is a custom DSL made by IFS

## 🏁 Goals

We want to be able to:

- Do reference lookups, auto-completion, typical intellisense features
- Quickly search the entire codebase for symbols
- Do static analysis and linting
- Find unused references
- Do project-wide refactoring for symbols
- Provide access to this insight to a MCP client to provide understanding of the code

## 🏗️ What we need to build to achieve this

We need:

- A parser that is able to produce an abstract syntax tree (AST) for all of these different languages
  - There are **>1 GB** worth of source code in the codebase, thus the parser **MUST be FAST! 🚀**
- An index where we can store all of this information for quick retrieval
  - SQLite should be suitable for this
- A rule-based static analysis engine
  - The syntax should be simple enough that an LLM can generate these from declarative descriptions
  - This **MUST be FAST! 🚀**

## 🧑‍💻 Technology Stack

Based on these requirements, the obvious choice in 2025 is to use Rust and SQLite.

## Coding Style

Be consistent with formatting, naming conventions, and code organization. Follow the established patterns in the codebase and prioritize readability and maintainability. Most of the code should be self-explanatory, and comments should be used to clarify complex logic or intent.
It should be easy to understand for developers with limited experience in Rust.

## Documentation

Comprehensive documentation is essential for maintaining the codebase and onboarding new developers. This includes:

- Clear and concise code comments
- High-level architecture overviews
- Detailed API documentation
- Usage examples and tutorials

## Folder Structure

The folder structure should be organized in a way that reflects the different components of the parser. A suggested structure is as follows:

```
/src
  /parser
    /ast
    /lexer
    /parser
  /static_analysis
  /index
  /utils
```
