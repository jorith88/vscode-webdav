/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const fs = require("fs");
const path = require("path");
/*
    Provides storage of credentials in a file on the local file system.
    Does not support any kind of 'prefix' of the credential (since this
    storage mechanism is not shared with either Windows or OSX).  The
    file is secured as RW for the owner of the process.
 */
class FileTokenStorage {
    constructor(filename) {
        this._filename = filename;
    }
    AddEntries(newEntries, existingEntries) {
        const entries = existingEntries.concat(newEntries);
        return this.saveEntries(entries);
    }
    Clear() {
        return this.saveEntries([]);
    }
    LoadEntries() {
        const deferred = Q.defer();
        let entries = [];
        let err;
        try {
            const content = fs.readFileSync(this._filename, { encoding: "utf8", flag: "r" });
            entries = JSON.parse(content);
            deferred.resolve(entries);
        }
        catch (ex) {
            if (ex.code !== "ENOENT") {
                err = ex;
                deferred.reject(err);
            }
            else {
                // If it is ENOENT (the file doesn't exist or can't be found)
                // Return an empty array (no items yet)
                deferred.resolve([]);
            }
        }
        return deferred.promise;
    }
    RemoveEntries(entriesToKeep /*, entriesToRemove?: Array<any>*/) {
        return this.saveEntries(entriesToKeep);
    }
    saveEntries(entries) {
        const defer = Q.defer();
        const writeOptions = {
            encoding: "utf8",
            mode: 384,
            flag: "w"
        };
        // If the path we want to store in doesn't exist, create it
        const folder = path.dirname(this._filename);
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        fs.writeFile(this._filename, JSON.stringify(entries), writeOptions, (err) => {
            if (err) {
                defer.reject(err);
            }
            else {
                defer.resolve(undefined);
            }
        });
        return defer.promise;
    }
}
exports.FileTokenStorage = FileTokenStorage;

//# sourceMappingURL=file-token-storage.js.map
