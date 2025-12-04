// TreeCRDT SQLite extension glue for wa-sqlite.
// Links against the Rust static library (libtreecrdt_sqlite_ext.a) built for
// wasm32-unknown-emscripten and registers the extension via sqlite3_auto_extension.

#include <sqlite3.h>

// The Rust extension entrypoint (static-link build ignores the sqlite3_api_routines pointer).
extern int sqlite3_treecrdt_init(sqlite3 *db, char **pzErrMsg, const void *pApi);

// Called from main.c after sqlite3_initialize.
void treecrdt_register_auto(void) {
  // SQLite calls the registered function with (db, err, api); cast to silence
  // the prototype mismatch on platforms that declare xEntryPoint as void(*)(void).
  sqlite3_auto_extension((void (*)(void))sqlite3_treecrdt_init);
}
