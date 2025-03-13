import * as path from 'path';

export function getEntityPaths(concretePath?: string): string[] {
    const finalPaths = concretePath
        ? concretePath.split(',').map((entityPath) => entityPath.replace(/\.ts/g, '.{ts,js}'))
        : [path.join('src', 'modules', '**', '*.entity.{ts,js}')];

    return finalPaths;
}

export function getMigrationPaths(concretePath?: string): string[] {
    const finalPaths = concretePath
        ? concretePath.split(',').map((migrationPath) => migrationPath.replace(/\.ts/g, '.{ts,js}'))
        : [path.join('src', 'modules', '**', 'migrations', '*.{ts,js}')];

    return finalPaths;
}
