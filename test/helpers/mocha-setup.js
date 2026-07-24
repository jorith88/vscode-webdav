'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

// find-config resolves its home-directory fallback (via the 'user-home' package)
// exactly once, at the moment it is first required, by calling os.homedir()
// synchronously. Overriding HOME per-test is too late once that module is cached,
// so the override must happen here, before any spec file (and therefore extension.js)
// is required for the first time in this process.
const isolatedHome = fs.mkdtempSync(path.join(os.tmpdir(), 'webdav-test-home-'));
process.env.HOME = isolatedHome;
process.env.USERPROFILE = isolatedHome;
