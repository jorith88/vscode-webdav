A VS Code extension ("WebDAV Upload") that lets a user upload the active file to, or diff it against, a remote WebDAV server. Two commands are registered: `extension.webdavUpload` and `extension.webdavCompare`. Endpoints are configured per-project via a `webdav.json` file placed at or above the working directory (see README.md for its schema).

## Architecture

- `extension.js` is the entire extension — there is no build step. `package.json` points `main` directly at this file and it runs as plain CommonJS JS (not compiled from TypeScript), despite `webpack`/`ts-loader` being listed as devDependencies (currently unused — no webpack config exists).
- Command flow for both `upload` and `compare` goes through `doWebdavAction(webdavAction)`:
  1. Resolve the active editor's file path.
  2. `getEndpointConfigForCurrentPath()` walks up from the file's directory looking for the nearest `webdav.json` (via `find-config`), then matches the longest configured path prefix against the file's path relative to that config file — falling back to a `"/"` root mapping if nothing else matches.
  3. `getWebdavCredentials()` looks up stored credentials for the endpoint's host:port via `CredentialStore`, prompting the user with `showInputBox` if none exist yet.
  4. A `webdav-fs` client is created for the endpoint and the passed-in `webdavAction` callback (the actual upload or diff logic) is invoked with it.
  5. On success, newly entered credentials are persisted via `storeCredentials()`.
- `credentialstore/` is a vendored (Microsoft-licensed) cross-platform credential store, not original code in this repo — it ships as pre-compiled `.js`/`.js.map` with platform backends under `osx/`, `linux/`, `win32/`. Treat it as third-party; avoid modifying unless fixing a platform-specific bug, and keep changes minimal.
- `compare` downloads the remote file to a temp file (via `tmp`) and opens it against the local file using the built-in `vscode.diff` command.

## Development

- `npm test` runs the real test suite via `mocha` (`.mocharc.json`), plain Node — not VS Code's Extension Host. `test:unit`, `test:integration`, `test:smoke` scripts run each subset alone.
  - `test/mocks/vscode.js` + `test/helpers/require-stubs.js` inject a fake `vscode` module and a fake, in-memory `CredentialStore` via `Module._resolveFilename`/`require.cache` patching (there's no real `vscode` module outside a live Extension Host, and tests must never touch the real OS credential store). `test/helpers/load-extension.js` wires both up and returns a fresh `extension.js` instance per test.
  - `test/unit/endpoint-config.spec.js` covers `getEndpointConfigForCurrentPath`'s prefix-matching logic (exported from `extension.js` for this purpose — see below).
  - `test/integration/webdav-roundtrip.spec.js` and `upload-compare.spec.js` spin up a local ephemeral `webdav-server` instance and exercise the real `webdav-fs` client / `extension.js`'s `upload()`/`compare()` end-to-end.
  - `test/smoke/credentialstore.spec.js` only constructs the vendored `credentialstore/` platform backends (no `GetCredential`/`SetCredential` calls) — deliberately never touches a real OS credential store.
  - `test/helpers/mocha-setup.js` (loaded via `.mocharc.json`'s `require`) overrides `HOME`/`USERPROFILE` before any spec file loads, because `find-config`'s home-directory fallback is resolved once, at `require` time, via `user-home` → `os.homedir()` — a per-test env override would be too late.
  - `extension.js` exports `getEndpointConfigForCurrentPath`, `upload`, and `compare` purely for these tests; VS Code's Extension Host only ever calls `.activate`/`.deactivate`, so this is inert to real usage.
  - `test/runTest.ts` and `.vscode/launch.json`'s "Launch Tests" config are leftover, orphaned scaffolding for a never-finished `@vscode/test-electron` integration-test path (real VS Code binary + full Extension Host) — not wired to `npm test` and not necessary for the current suite.
- `.eslintrc.json` exists but eslint is now v10.x, which dropped legacy `.eslintrc.json` support (flat config only) — `npx eslint extension.js` will not work until an `eslint.config.js` is added. No `npm run lint` script is wired up regardless.
- To manually try the extension: open this folder in VS Code and press F5 ("Launch Extension" in `.vscode/launch.json`) to start an Extension Development Host.
- Version bumps go in `package.json` `version` plus a matching entry in `CHANGELOG.md`.
