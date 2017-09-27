/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const Q = require("q");
const linux_file_api_1 = require("./linux/linux-file-api");
const osx_keychain_api_1 = require("./osx/osx-keychain-api");
const win_credstore_api_1 = require("./win32/win-credstore-api");
/**
 * Implements a credential storage for Windows, Mac (darwin), or Linux.
 *
 * Allows a single credential to be stored per service (that is, one username per service);
 */
class CredentialStore {
    constructor(prefix, folder, filename) {
        this._defaultPrefix = "secret:";
        this._defaultFilename = "secrets.json";
        this._defaultFolder = ".secrets";
        if (prefix !== undefined) {
            this._prefix = prefix;
        }
        if (folder !== undefined) {
            this._folder = folder;
        }
        if (filename !== undefined) {
            this._filename = filename;
        }
        // In the case of win32 or darwin, this._folder will contain the prefix.
        switch (os.platform()) {
            case "win32":
                if (prefix === undefined) {
                    this._prefix = this._defaultPrefix;
                }
                this._credentialStore = new win_credstore_api_1.WindowsCredentialStoreApi(this._prefix);
                break;
            case "darwin":
                if (prefix === undefined) {
                    this._prefix = this._defaultPrefix;
                }
                this._credentialStore = new osx_keychain_api_1.OsxKeychainApi(this._prefix);
                break;
            /* tslint:disable:no-switch-case-fall-through */
            case "linux":
            default:
                /* tslint:enable:no-switch-case-fall-through */
                if (folder === undefined) {
                    this._folder = this._defaultFolder;
                }
                if (filename === undefined) {
                    this._filename = this._defaultFilename;
                }
                this._credentialStore = new linux_file_api_1.LinuxFileApi(this._folder, this._filename);
                break;
        }
    }
    GetCredential(service) {
        return this._credentialStore.GetCredential(service);
    }
    SetCredential(service, username, password) {
        const deferred = Q.defer();
        // First, look to see if we have a credential for this service already.  If so, remove it
        // since we don't know if the user is changing the username or the password (or both) for
        // the particular service.
        this.GetCredential(service).then((cred) => {
            if (cred !== undefined) {
                // On Windows, "*" will delete all matching credentials in one go
                // On Linux, we use 'underscore' to remove the ones we want to remove and save the leftovers
                // On Mac, "*" will find all matches and delete each individually
                this.RemoveCredential(service).then(() => {
                    this._credentialStore.SetCredential(service, username, password).then(() => {
                        deferred.resolve(undefined);
                    }).catch((reason) => {
                        deferred.reject(reason);
                    });
                });
            }
            else {
                this._credentialStore.SetCredential(service, username, password).then(() => {
                    deferred.resolve(undefined);
                }).catch((reason) => {
                    deferred.reject(reason);
                });
            }
        }).catch((reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    RemoveCredential(service) {
        return this._credentialStore.RemoveCredential(service);
    }
    // Used by tests to ensure certain credentials we create don't exist
    getCredentialByName(service, username) {
        return this._credentialStore.getCredentialByName(service, username);
    }
    // Used by tests to remove certain credentials
    removeCredentialByName(service, username) {
        return this._credentialStore.removeCredentialByName(service, username);
    }
}
exports.CredentialStore = CredentialStore;

//# sourceMappingURL=credentialstore.js.map
