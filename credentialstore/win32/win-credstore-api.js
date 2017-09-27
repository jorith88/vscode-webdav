/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const credential_1 = require("../credential");
const Q = require("q");
/* tslint:disable:no-var-keyword */
var wincredstore = require("./win-credstore");
/* tslint:enable:no-var-keyword */
/*
    Provides the ICredentialStore API on top of Windows Credential Store-based storage.

    User can provide a custom prefix for the credential.
 */
class WindowsCredentialStoreApi {
    constructor(credentialPrefix) {
        if (credentialPrefix !== undefined) {
            wincredstore.setPrefix(credentialPrefix);
        }
    }
    GetCredential(service) {
        const deferred = Q.defer();
        let credential;
        //TODO: Why not just have listCredentials send back the ones I want based on (optional) service?
        this.listCredentials().then((credentials) => {
            //Spin through the returned credentials to ensure I got the one I want based on passed in 'service'
            for (let index = 0; index < credentials.length; index++) {
                credential = this.createCredential(credentials[index]);
                if (credential.Service === service) {
                    break;
                }
                else {
                    // The current credential isn't the one we're looking for
                    credential = undefined;
                }
            }
            deferred.resolve(credential);
        }).fail((reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    SetCredential(service, username, password) {
        const deferred = Q.defer();
        const targetName = this.createTargetName(service, username);
        // Here, `password` is either the password or pat
        wincredstore.set(targetName, password, function (err) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(undefined);
            }
        });
        return deferred.promise;
    }
    RemoveCredential(service) {
        const deferred = Q.defer();
        const targetName = this.createTargetName(service, "*");
        wincredstore.remove(targetName, function (err) {
            if (err) {
                if (err.code !== undefined && err.code === 1168) {
                    //code 1168: not found
                    // If credential isn't found, don't fail.
                    deferred.resolve(undefined);
                }
                else {
                    deferred.reject(err);
                }
            }
            else {
                deferred.resolve(undefined);
            }
        });
        return deferred.promise;
    }
    // Adding for test purposes (to ensure a particular credential doesn't exist)
    getCredentialByName(service, username) {
        const deferred = Q.defer();
        let credential;
        this.listCredentials().then((credentials) => {
            //Spin through the returned credentials to ensure I got the one I want based on passed in 'service'
            for (let index = 0; index < credentials.length; index++) {
                credential = this.createCredential(credentials[index]);
                if (credential.Service === service && credential.Username === username) {
                    break;
                }
                else {
                    // The current credential isn't the one we're looking for
                    credential = undefined;
                }
            }
            deferred.resolve(credential);
        }).fail((reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }
    removeCredentialByName(service, username) {
        const deferred = Q.defer();
        const targetName = this.createTargetName(service, username);
        wincredstore.remove(targetName, function (err) {
            if (err) {
                if (err.code !== undefined && err.code === 1168) {
                    //code 1168: not found
                    // If credential isn't found, don't fail.
                    deferred.resolve(undefined);
                }
                else {
                    deferred.reject(err);
                }
            }
            else {
                deferred.resolve(undefined);
            }
        });
        return deferred.promise;
    }
    createCredential(cred) {
        const password = new Buffer(cred.credential, "hex").toString("utf8");
        // http://servername:port|\\domain\username
        const segments = cred.targetName.split(WindowsCredentialStoreApi.separator);
        const username = segments[segments.length - 1];
        const service = segments[0];
        return new credential_1.Credential(service, username, password);
    }
    createTargetName(service, username) {
        return service + WindowsCredentialStoreApi.separator + username;
    }
    listCredentials() {
        const deferred = Q.defer();
        const credentials = [];
        const stream = wincredstore.list();
        stream.on("data", (cred) => {
            credentials.push(cred);
        });
        stream.on("end", () => {
            deferred.resolve(credentials);
        });
        stream.on("error", (error) => {
            console.log(error);
            deferred.reject(error);
        });
        return deferred.promise;
    }
}
WindowsCredentialStoreApi.separator = "|";
exports.WindowsCredentialStoreApi = WindowsCredentialStoreApi;

//# sourceMappingURL=win-credstore-api.js.map
