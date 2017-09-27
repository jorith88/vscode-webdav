/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_token_storage_1 = require("./file-token-storage");
const credential_1 = require("../credential");
const Q = require("q");
const os = require("os");
const path = require("path");
const _ = require("underscore");
/*
    Provides the ICredentialStore API on top of file-based storage.
    Does not support any kind of 'prefix' of the credential (since its
    storage mechanism is not shared with either Windows or OSX).

    User must provide a custom folder and custom file name for storage.
 */
class LinuxFileApi {
    constructor(folder, filename) {
        this._folder = folder;
        this._filename = filename;
        this._fts = new file_token_storage_1.FileTokenStorage(path.join(path.join(os.homedir(), this._folder, this._filename)));
    }
    GetCredential(service) {
        const deferred = Q.defer();
        this.loadCredentials().then((entries) => {
            // Find the entry I want based on service
            const entryArray = _.where(entries, { service: service });
            if (entryArray !== undefined && entryArray.length > 0) {
                const credential = this.createCredential(entryArray[0]);
                deferred.resolve(credential);
            }
            else {
                deferred.resolve(undefined);
            }
        })
            .catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
    SetCredential(service, username, password) {
        const deferred = Q.defer();
        this.loadCredentials().then((entries) => {
            // Remove any entries that are the same as the one I'm about to add
            const existingEntries = _.reject(entries, function (elem) {
                return elem.username === username && elem.service === service;
            });
            const newEntry = {
                username: username,
                password: password,
                service: service
            };
            this._fts.AddEntries([newEntry], existingEntries).then(() => {
                deferred.resolve(undefined);
            }).catch((err) => {
                deferred.reject(err);
            });
        })
            .catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
    RemoveCredential(service) {
        const deferred = Q.defer();
        this.loadCredentials().then((entries) => {
            // Find the entry being asked to be removed; if found, remove it, save the remaining list
            const existingEntries = _.reject(entries, function (elem) {
                return elem.service === service;
            });
            // TODO: RemoveEntries doesn't do anything with second arg.  For now, do nothing to
            // the api as I'm wrapping it in all its glory.  Could consider later.
            this._fts.RemoveEntries(existingEntries /*, undefined*/).then(() => {
                deferred.resolve(undefined);
            }).catch((err) => {
                deferred.reject(err);
            });
        })
            .catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
    getCredentialByName(service, username) {
        const deferred = Q.defer();
        this.loadCredentials().then((entries) => {
            // Find the entry I want based on service and username
            const entryArray = _.where(entries, { service: service, username: username });
            if (entryArray !== undefined && entryArray.length > 0) {
                const credential = this.createCredential(entryArray[0]);
                deferred.resolve(credential);
            }
            else {
                deferred.resolve(undefined);
            }
        })
            .catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
    removeCredentialByName(service, username) {
        const deferred = Q.defer();
        this.loadCredentials().then((entries) => {
            // Find the entry being asked to be removed; if found, remove it, save the remaining list
            const existingEntries = _.reject(entries, function (elem) {
                if (username === "*") {
                    return elem.service === service;
                }
                else {
                    return elem.username === username && elem.service === service;
                }
            });
            // TODO: RemoveEntries doesn't do anything with second arg.  For now, do nothing to
            // the api as I'm wrapping it in all its glory.  Could consider later.
            this._fts.RemoveEntries(existingEntries /*, undefined*/).then(() => {
                deferred.resolve(undefined);
            }).catch((err) => {
                deferred.reject(err);
            });
        })
            .catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
    createCredential(cred) {
        return new credential_1.Credential(cred.service, cred.username, cred.password);
    }
    loadCredentials() {
        const deferred = Q.defer();
        this._fts.LoadEntries().then((entries) => {
            deferred.resolve(entries);
        })
            .catch((err) => {
            deferred.reject(err);
        });
        return deferred.promise;
    }
}
exports.LinuxFileApi = LinuxFileApi;

//# sourceMappingURL=linux-file-api.js.map
