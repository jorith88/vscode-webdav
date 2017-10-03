# WebDAV support for Visual Studio Code

The WebDAV extension makes it easy to compare and upload files to a remote WebDAV server.

Commands added by this extension:
- WebDAV: Compare ( `extension.webdavCompare` )
- WebDAV: Upload ( `extension.webdavUpload` )

## Configuration
To configure one or more remote endpoints, add a `webdav.json` to your project root. In this file you can define the endpoints based on one or more folders.

### webdav.json Structure
| Key  | Value |
| ------------- | ------------- |
| The path, relative to webdav.json, that corresponds to the root of the WebDAV endpoint | <ul><li>`url` (String): The URL of the WebDAV endpoint</li><li>`ignoreSSLErrors` (Boolean, optional): Ignore SSL verification errors. This option is mainly intended for DEV endpoints that have a self-signed certificate.</li></ul>   |

### webdav.json Example
```json
{
    "/frontend/www": {
        "url": "https://webdav.example.com/"
    },
    "/another-frontend/www": {
        "url": "https://webdav2.example.com/",
        "ignoreSSLErrors": true
    }
}
```

## Password storage
The first time you connect to a new remote endpoint this extension will ask for a username and password. This password will be stored (using the `keytar` library) in the system's keychain. On macOS the passwords are managed by the Keychain, on Linux they are managed by the Secret Service API/libsecret, and on Windows they are managed by Credential Vault.

