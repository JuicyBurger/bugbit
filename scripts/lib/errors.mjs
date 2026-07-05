export function printJson(obj) {
  console.log(JSON.stringify(obj));
}

export function fail(code, message) {
  printJson({ error: { code, message } });
  process.exit(1);
}
