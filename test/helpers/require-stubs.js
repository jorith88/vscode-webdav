'use strict';
const Module = require('module');
const path = require('path');

const VSCODE_VIRTUAL_ID = '\0vscode-mock';

function installVscodeMock(vscodeMockExports) {
    const originalResolveFilename = Module._resolveFilename;
    Module._resolveFilename = function (request, ...args) {
        if (request === 'vscode') return VSCODE_VIRTUAL_ID;
        return originalResolveFilename.call(this, request, ...args);
    };
    require.cache[VSCODE_VIRTUAL_ID] = {
        id: VSCODE_VIRTUAL_ID,
        filename: VSCODE_VIRTUAL_ID,
        loaded: true,
        exports: vscodeMockExports
    };
    return function uninstall() {
        Module._resolveFilename = originalResolveFilename;
        delete require.cache[VSCODE_VIRTUAL_ID];
    };
}

class FakeCredentialStore {
    constructor() { this._store = new Map(); }
    GetCredential(key) { return Promise.resolve(this._store.get(key)); }
    SetCredential(key, username, password) {
        this._store.set(key, { newCredentials: false, _username: username, _password: password });
        return Promise.resolve();
    }
    RemoveCredential(key) { this._store.delete(key); return Promise.resolve(); }
}

function installFakeCredentialStore() {
    const credentialstorePath = require.resolve(
        path.join(__dirname, '..', '..', 'credentialstore', 'credentialstore.js')
    );
    require.cache[credentialstorePath] = {
        id: credentialstorePath,
        filename: credentialstorePath,
        loaded: true,
        exports: { CredentialStore: FakeCredentialStore }
    };
    return function uninstall() { delete require.cache[credentialstorePath]; };
}

module.exports = { installVscodeMock, installFakeCredentialStore, FakeCredentialStore };
