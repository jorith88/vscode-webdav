'use strict';
const path = require('path');
const { installVscodeMock, installFakeCredentialStore } = require('./require-stubs');
const { createMock } = require('../mocks/vscode');

const EXTENSION_PATH = require.resolve(path.join(__dirname, '..', '..', 'extension.js'));

// extension.js reads `vscode` and instantiates the credential store once, at module
// load time, so both stubs must be installed and extension.js's cache entry cleared
// before every fresh require — otherwise a test would silently reuse whichever mock
// happened to be active the first time extension.js was ever loaded in this process.
function loadExtension() {
    const vscode = createMock();
    const uninstallVscode = installVscodeMock(vscode);
    const uninstallCredStore = installFakeCredentialStore();
    delete require.cache[EXTENSION_PATH];
    const extension = require(EXTENSION_PATH);
    return {
        extension,
        vscode,
        unload() {
            delete require.cache[EXTENSION_PATH];
            uninstallCredStore();
            uninstallVscode();
        }
    };
}

module.exports = { loadExtension };
