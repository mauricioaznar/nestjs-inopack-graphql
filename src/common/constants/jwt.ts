const expiresIn = '43200s';

// Single access point for every JWT secret. Call sites (auth.module,
// jwt.strategy, files.module, memory-token.module) keep importing
// `jwtConstants`; only the source of the values changed — they now come from the
// environment instead of being hardcoded in this file.
//
// In production an unset secret is a hard boot failure: a fallback there would
// silently sign tokens with a value that is public in this repository. Outside
// production the fallback keeps local development and the test suite running
// without an env change.
function readSecret(name: string, developmentFallback: string): string {
    const value = process.env[name];
    if (value) {
        return value;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            `${name} is not set. Production requires an explicit JWT secret.`,
        );
    }
    return developmentFallback;
}

export const jwtConstants = {
    authSecret: readSecret('JWT_ACCESS_SECRET', 'secretKey'),
    fileSecret: readSecret('JWT_FILE_SECRET', 'fileSecret'),
    authExpiresIn: expiresIn,
    fileExpiresIn: expiresIn,
};
