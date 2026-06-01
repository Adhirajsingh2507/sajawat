/**
 * Database module barrel.
 *
 * Public surface of the persistence layer. Domain modules (0.6+) consume the
 * base plugin and repository conventions documented here; the connection
 * lifecycle and health probe are used by the server entry point and the
 * readiness route respectively.
 */
export { connectToDatabase, disconnectFromDatabase } from './connection.js';
export { checkDatabaseHealth } from './health.js';
export type { DbHealth, DbConnectionState } from './health.js';
export { baseSchemaPlugin } from './base-plugin.js';
