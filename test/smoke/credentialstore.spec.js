'use strict';
const assert = require('assert/strict');
const { OsxKeychainApi } = require('../../credentialstore/osx/osx-keychain-api.js');
const { WindowsCredentialStoreApi } = require('../../credentialstore/win32/win-credstore-api.js');
const { LinuxFileApi } = require('../../credentialstore/linux/linux-file-api.js');

// Smoke tests only: these deliberately never call GetCredential/SetCredential,
// which is where real OS credential-store access (macOS Keychain, Windows
// Credential Vault, a real file on disk) actually happens. Constructing each
// backend class directly (bypassing CredentialStore's os.platform() switch)
// covers all three platforms' require/instantiate paths regardless of which
// OS is running the tests, with zero risk of a blocking OS credential prompt.
describe('credentialstore platform backends (smoke only)', () => {
    it('constructs OsxKeychainApi without throwing or touching the keychain', () => {
        assert.doesNotThrow(() => new OsxKeychainApi('vscode-webdav-test:'));
    });

    it('constructs WindowsCredentialStoreApi without throwing or spawning creds.exe', () => {
        assert.doesNotThrow(() => new WindowsCredentialStoreApi('vscode-webdav-test:'));
    });

    it('constructs LinuxFileApi without throwing or touching disk', () => {
        assert.doesNotThrow(() => new LinuxFileApi('.webdav-test', 'webdav-secrets-test.json'));
    });
});
