/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//TODO: Add an interface that represents a Credential?
class Credential {
    constructor(service, username, password) {
        this._service = service;
        this._username = username;
        this._password = password;
    }
    get Service() {
        return this._service;
    }
    get Username() {
        return this._username;
    }
    get Password() {
        return this._password;
    }
}
exports.Credential = Credential;

//# sourceMappingURL=credential.js.map
