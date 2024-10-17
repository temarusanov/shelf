# Schematics

Library contains utils to generate and execute commands working with Nx

```
npm i --save-dev @shelfjs/schematics
```

## Executors

### Prisma

Run prisma under your project configuration

Supports

- Generate
- Migrate deploy
- Migrate dev
- Migrate reset
- Pull
- Studio

Usage in `project.json`

```
{
  "name": "server",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/server/src",
  "targets": {
    "generate": {
      "executor": "@shelfjs/schematics:prisma-generate",
      "outputs": ["{workspaceRoot}/node_modules/generatedprisma"], // for cache
      "options": {
        "schema": "{projectRoot}/prisma/schema.prisma" // provide if your schema not in {projectRoot}/src/prisma/schema.prisma
      }
    },
  }
}
```

## Generators

### Nest Module

Generate nest dynamic module with `.forRoot()` and module configs

Usage:

`--events` generate additional events provider interface. default: true

`--repository` generate additional repostiory provider interface. default: false

```bash
nx g @shelfjs/schematics:nest-module <module-name> <path from root>
```

### Nest CQRS

Generate nest command and queries with additional GraphQL resolver

Usage:

`--graphql` generate GraphQL resolver

`--rest` generate REST controller

`--test` generate Jest tests

```bash
nx g @shelfjs/schematics:nest-cqrs <command/query> <name> <path from root>
```
