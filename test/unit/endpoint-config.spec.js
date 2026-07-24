'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadExtension } = require('../helpers/load-extension');
const { writeWebdavConfig } = require('../helpers/temp-config-tree');

describe('getEndpointConfigForCurrentPath', () => {
    let loaded;
    let fixture;

    afterEach(() => {
        if (fixture) { fixture.cleanup(); fixture = undefined; }
        if (loaded) { loaded.unload(); loaded = undefined; }
    });

    it('matches the deepest nested prefix over the root fallback', () => {
        fixture = writeWebdavConfig({
            '/': { url: 'https://root.example.com/' },
            '/project': { url: 'https://project.example.com/' }
        });
        loaded = loadExtension();

        const result = loaded.extension.getEndpointConfigForCurrentPath(
            fixture.workingDir('project', 'src', 'deep')
        );

        assert.deepEqual(result, {
            localRootPath: '/project',
            remoteEndpoint: { url: 'https://project.example.com/' }
        });
    });

    it('matches a config key with a trailing slash via the "+ /" fallback', () => {
        fixture = writeWebdavConfig({
            '/project/': { url: 'https://project.example.com/' }
        });
        loaded = loadExtension();

        const result = loaded.extension.getEndpointConfigForCurrentPath(
            fixture.workingDir('project')
        );

        assert.deepEqual(result, {
            localRootPath: '/project',
            remoteEndpoint: { url: 'https://project.example.com/' }
        });
    });

    it('falls back to the "/" root mapping when nothing else matches', () => {
        fixture = writeWebdavConfig({
            '/other': { url: 'https://other.example.com/' },
            '/': { url: 'https://root.example.com/' }
        });
        loaded = loadExtension();

        const result = loaded.extension.getEndpointConfigForCurrentPath(
            fixture.workingDir('unmatched', 'deep', 'path')
        );

        assert.deepEqual(result, {
            localRootPath: '',
            remoteEndpoint: { url: 'https://root.example.com/' }
        });
    });

    it('returns undefined and shows an error when no webdav.json is found', () => {
        loaded = loadExtension();
        const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webdav-no-config-'));

        try {
            const result = loaded.extension.getEndpointConfigForCurrentPath(isolatedDir);

            assert.equal(result, undefined);
            assert.equal(loaded.vscode.window.showErrorMessage.calls.length, 1);
            assert.match(loaded.vscode.window.showErrorMessage.calls[0][0], /not found/);
        } finally {
            fs.rmSync(isolatedDir, { recursive: true, force: true });
        }
    });

    it('returns null and shows an error when no prefix matches and there is no "/" root mapping', () => {
        fixture = writeWebdavConfig({
            '/foo': { url: 'https://foo.example.com/' },
            '/bar': { url: 'https://bar.example.com/' }
        });
        loaded = loadExtension();

        const result = loaded.extension.getEndpointConfigForCurrentPath(
            fixture.workingDir('unrelated', 'deep')
        );

        assert.equal(result, null);
        assert.equal(loaded.vscode.window.showErrorMessage.calls.length, 1);
        assert.match(
            loaded.vscode.window.showErrorMessage.calls[0][0],
            /Cannot find a remote endpoint configuration/
        );
    });
});
