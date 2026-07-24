'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

function writeWebdavConfig(configObject) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'webdav-fixture-'));
    fs.writeFileSync(path.join(dir, 'webdav.json'), JSON.stringify(configObject));
    return {
        root: dir,
        workingDir: (...segments) => path.join(dir, ...segments),
        cleanup: () => fs.rmSync(dir, { recursive: true, force: true })
    };
}

module.exports = { writeWebdavConfig };
