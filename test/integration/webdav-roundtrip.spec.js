'use strict';
const assert = require('assert/strict');
const { createAdapter: webdavFs } = require('webdav-fs');
const { v2: webdav } = require('webdav-server');

describe('webdav-fs round trip against a local WebDAV server', () => {
    let server;
    let port;

    beforeEach(async () => {
        const userManager = new webdav.SimpleUserManager();
        const user = userManager.addUser('testuser', 'testpass');
        const privilegeManager = new webdav.SimplePathPrivilegeManager();
        privilegeManager.setRights(user, '/', ['all']);

        server = new webdav.WebDAVServer({
            httpAuthentication: new webdav.HTTPBasicAuthentication(userManager, 'test-realm'),
            privilegeManager,
            rootFileSystem: new webdav.VirtualFileSystem()
        });

        const httpServer = await server.startAsync(0);
        port = httpServer.address().port;
    });

    afterEach(async () => {
        await server.stopAsync();
    });

    it('writes then reads back the same content via writeFile/readFile, same call shape as extension.js', async () => {
        const client = webdavFs(`http://127.0.0.1:${port}/`, { username: 'testuser', password: 'testpass' });

        await new Promise((resolve, reject) =>
            client.writeFile('/roundtrip.txt', 'hello webdav', err => (err ? reject(err) : resolve()))
        );

        const data = await new Promise((resolve, reject) =>
            client.readFile('/roundtrip.txt', 'utf8', (err, data) => (err ? reject(err) : resolve(data)))
        );

        assert.equal(data, 'hello webdav');
    });
});
