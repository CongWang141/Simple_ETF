import "server-only";
import path from "node:path";

type SqliteStatement = { all: (...parameters: unknown[]) => unknown[]; get: (...parameters: unknown[]) => unknown };
type SqliteDatabase = { prepare: (sql: string) => SqliteStatement };
type SqliteConstructor = new (filename: string, options?: { readonly?: boolean; fileMustExist?: boolean }) => SqliteDatabase;

const databasePath = path.join(process.cwd(), "data", "simple_etf.sqlite");
const Database = require("better-sqlite3") as SqliteConstructor;

export const db = new Database(databasePath, { readonly: true, fileMustExist: true });
