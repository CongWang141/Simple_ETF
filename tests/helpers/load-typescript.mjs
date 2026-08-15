import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const root = new URL("../../", import.meta.url);

/** Loads a pure TypeScript module in Node's built-in test runner without another test dependency. */
export async function loadTypeScriptModule(pathFromRoot) {
  const source = await readFile(fileURLToPath(new URL(pathFromRoot, root)), "utf8");
  const output = typescript.transpileModule(source, {
    compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}
