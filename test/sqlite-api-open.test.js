import * as SQLite from '../src/sqlite-api.js';

describe('SQLite API open cleanup', function() {
  it('closes the database handle returned by a failed open', async function() {
    const failedHandle = 42;
    const close = jasmine.createSpy('sqlite3_close').and.resolveTo(SQLite.SQLITE_OK);
    const registerExtensionFunctions = jasmine.createSpy('RegisterExtensionFunctions');
    const free = jasmine.createSpy('sqlite3_free');
    const module = {
      HEAPU8: new Uint8Array(1024),
      _getSqliteFree: () => 0,
      _malloc: () => 8,
      _sqlite3_free: free,
      _sqlite3_malloc: () => 32,
      ccall: (name) => {
        if (name === 'sqlite3_errmsg') return 'unable to open database file';
        if (name === 'RegisterExtensionFunctions') registerExtensionFunctions();
        return undefined;
      },
      cwrap: (name) => {
        if (name === 'sqlite3_open_v2') {
          return async () => SQLite.SQLITE_CANTOPEN;
        }
        if (name === 'sqlite3_close') return close;
        return () => SQLite.SQLITE_OK;
      },
      getTempRet0: () => 0,
      getValue: () => failedHandle,
      vfs_register: () => SQLite.SQLITE_OK,
    };
    const sqlite3 = SQLite.Factory(module);

    await expectAsync(sqlite3.open_v2('/cannot-open.db')).toBeRejectedWithError(
      SQLite.SQLiteError,
      'unable to open database file',
    );

    expect(close).toHaveBeenCalledOnceWith(failedHandle);
    expect(registerExtensionFunctions).not.toHaveBeenCalled();
    expect(free).toHaveBeenCalled();
    await expectAsync(sqlite3.close(failedHandle)).toBeRejectedWithError(
      SQLite.SQLiteError,
      'not a database',
    );
  });
});
