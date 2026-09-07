import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * `import.meta.glob` is a Vite build-time feature: statically replaced
 * during file transformation, so ambient types for it aren't pulled
 * into this project (no `vite/client` types — the real Nest app never
 * runs under Vite). Declared narrowly here rather than cast at each
 * call site, which would erase the call expression's shape and break
 * Vite's ability to recognize and rewrite it.
 */
type GlobModule = Record<string, unknown>;

declare global {
  interface ImportMeta {
    glob?: (
      pattern: string,
      options: { eager: true },
    ) => Record<string, GlobModule>;
  }
}

function flattenClasses(
  modules: Record<string, GlobModule>,
): NewableFunction[] {
  return Object.values(modules)
    .flatMap((mod) => Object.values(mod))
    .filter((value): value is NewableFunction => typeof value === 'function');
}

/**
 * Under Vitest (e2e tests boot the real `AppModule` against a test
 * database), `src` is run directly with no `dist` build step — and
 * TypeORM's own directory-glob entity/migration loader does a plain
 * Node dynamic `import()` at runtime that bypasses Vite's transform,
 * which breaks on the decorators our entities use. `import.meta.glob`
 * resolves those classes at transform time instead.
 */
function loadVitestEntitiesAndMigrations(): {
  entities: NewableFunction[];
  migrations: NewableFunction[];
} {
  const entityModules = import.meta.glob!('../**/*.entity.ts', {
    eager: true,
  });
  const migrationModules = import.meta.glob!('../database/migrations/*.ts', {
    eager: true,
  });
  return {
    entities: flattenClasses(entityModules),
    migrations: flattenClasses(migrationModules),
  };
}

/**
 * Runtime TypeORM options, consumed by `TypeOrmModule.forRootAsync` in
 * AppModule. Targets compiled output (`dist/**`), since Nest's default
 * `tsc` builder writes `.js` files there before running the app.
 *
 * `synchronize` is hardcoded to `false` (never env-driven) so it can
 * never be flipped on by accident in any environment.
 */
export function typeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  const base = {
    type: 'mysql' as const,
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_DATABASE'),
    timezone: 'Z',
    synchronize: false,
  };

  if (process.env.VITEST) {
    return { ...base, ...loadVitestEntitiesAndMigrations() };
  }

  return {
    ...base,
    entities: [`${import.meta.dirname}/../**/*.entity.js`],
    migrations: [`${import.meta.dirname}/../database/migrations/*.js`],
  };
}
