# Database Migrations

This directory contains Prisma migration files.

## Creating a Migration

After modifying `schema.prisma`, create a migration:

```bash
npx prisma migrate dev --name your_migration_name
```

## Applying Migrations in Production

```bash
npx prisma migrate deploy
```

## Initial Migration

The first migration should be created with:

```bash
npx prisma migrate dev --name init
```

This will create the initial database schema based on `schema.prisma`.
