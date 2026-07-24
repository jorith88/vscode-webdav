'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const { createAdapter: webdavFs } = require('webdav-fs');
const { v2: webdav } = require('webdav-server');
const { loadExtension } = require('../helpers/load-extension');
const { writeWebdavConfig } = require('../helpers/temp-config-tree');
const { waitFor } = require('../helpers/wait-for');

describe('extension.upload() / extension.compare() end-to-end', () => {
    let server;
    let port;
    let fixture;
    let loaded;

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
        if (fixture) { fixture.cleanup(); fixture = undefined; }
        if (loaded) { loaded.unload(); loaded = undefined; }
        await server.stopAsync();
    });

    function setUpFixtureAndEditor(fileName) {
        const serverUrl = `http://127.0.0.1:${port}/`;
        fixture = writeWebdavConfig({ '/': { url: serverUrl } });
        const workingFile = fixture.workingDir(fileName);

        loaded = loadExtension();
        loaded.vscode.workspace.rootPath = fixture.root;
        loaded.vscode.window.activeTextEditor = {
            document: {
                uri: { fsPath: workingFile },
                getText: () => 'hello from upload test'
            }
        };
        loaded.vscode.window.showInputBox.resolveWith('testuser');
        loaded.vscode.window.showInputBox.resolveWith('testpass');

        return { workingFile, serverUrl };
    }

    it('uploads the active editor content to the remote WebDAV server', async () => {
        const { serverUrl } = setUpFixtureAndEditor('foo.txt');

        loaded.extension.upload();
        await waitFor(() => loaded.vscode.window.showInformationMessage.calls.length > 0);

        assert.match(loaded.vscode.window.showInformationMessage.calls[0][0], /Uploaded: foo\.txt/);
        assert.equal(loaded.vscode.window.showErrorMessage.calls.length, 0);

        const verifyClient = webdavFs(serverUrl, { username: 'testuser', password: 'testpass' });
        const remoteContent = await new Promise((resolve, reject) =>
            verifyClient.readFile('/foo.txt', 'utf8', (err, data) => (err ? reject(err) : resolve(data)))
        );
        assert.equal(remoteContent, 'hello from upload test');

        // Credentials should now be cached: a second upload must not prompt again.
        loaded.vscode.window.showInputBox.reset();
        loaded.vscode.window.showInformationMessage.reset();
        loaded.extension.upload();
        await waitFor(() => loaded.vscode.window.showInformationMessage.calls.length > 0);
        assert.equal(loaded.vscode.window.showInputBox.calls.length, 0);
    });

    it('downloads the remote file and opens a diff against the local file', async () => {
        const { workingFile, serverUrl } = setUpFixtureAndEditor('bar.txt');

        const seedClient = webdavFs(serverUrl, { username: 'testuser', password: 'testpass' });
        await new Promise((resolve, reject) =>
            seedClient.writeFile('/bar.txt', 'server content for compare', err => (err ? reject(err) : resolve()))
        );

        loaded.extension.compare();
        await waitFor(() => loaded.vscode.commands.executeCommand.calls.length > 0);

        const [command, tmpUri, workingFileUri, title, options] = loaded.vscode.commands.executeCommand.calls[0];
        assert.equal(command, 'vscode.diff');
        assert.equal(workingFileUri.fsPath, workingFile);
        assert.match(title, /^bar\.txt \(WebDAV Compare\)$/);
        assert.deepEqual(options, { preview: false, selection: null });

        const tmpContent = fs.readFileSync(tmpUri.fsPath, 'utf8');
        assert.equal(tmpContent, 'server content for compare');
    });
});
