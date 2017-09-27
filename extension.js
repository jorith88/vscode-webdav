const vscode = require('vscode');
const fs = require("fs");
const findConfig = require('find-config');
const path = require('path');
const tmp = require('tmp');
const CredentialStore = require('./credentialstore/credentialstore.js');

const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5);
const credStore = new CredentialStore.CredentialStore("vscode-webdav:", ".webdav", "webdav-secrets.json");

function activate(context) {
    const uploadCommand = vscode.commands.registerCommand('extension.webdavUpload', upload);
    const compareCommand = vscode.commands.registerCommand('extension.webdavCompare', compare);

    statusBar.command = 'extension.webdavUpload';
    statusBar.text = '$(cloud-upload) Upload to WebDAV';

    context.subscriptions.push(statusBar);
    context.subscriptions.push(uploadCommand);
    context.subscriptions.push(compareCommand);

    statusBar.show();



    // credStore.SetCredential('test123', 'username', 'password').then(function(result) {
    //     console.log('1', result); // "Stuff worked!"

    //     const credential = credStore.GetCredential('test123').then(function(result) {
    //         console.log('3', result._password); // "Stuff worked!"
    //     }, function(err) {
    //         console.log('5', err); // Error: "It broke"
    //     });





    // }, function(err) {
    //     console.log('2', err); // Error: "It broke"
    // });
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

exports.deactivate = deactivate;

function upload() {
    doWebdavAction(function(webdav, workingFile, remoteFile) {
        const editor = vscode.window.activeTextEditor;

        webdav.writeFile(remoteFile, editor.document.getText() , function(err) {
            if (err != null) {
                console.error(err);
                vscode.window.showErrorMessage('Failed to upload file to remote host: ' + err.message);
            } else {
                const fileName = remoteFile.slice(remoteFile.lastIndexOf('/') + 1);

                statusBar.text    = "$(cloud-upload) Uploaded " + fileName + "...";
                statusBar.command = null;
                statusBar.color   = '#4cff4c';

                setTimeout(function() {
                    statusBar.text    = '$(cloud-upload) Upload to WebDAV';
                    statusBar.command = 'extension.webdavUpload';
                    statusBar.color   = '#fff';
                }, 2000)
            }
        });
    });
}

function compare() {
    doWebdavAction(function(webdav, workingFile, remoteFile) {

        // Write the remote file to a local temporary file
        const extension = workingFile.slice(workingFile.lastIndexOf('.'));
        var tmpFile = tmp.fileSync({ postfix: extension });
        webdav.readFile(remoteFile, "utf8", function(error, data) {
            fs.writeFileSync(tmpFile.name, data, function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            // Compare!
            try {
                const fileName = remoteFile.slice(remoteFile.lastIndexOf('/') + 1);

                vscode.commands.executeCommand('vscode.diff',
                    vscode.Uri.file(tmpFile.name),
                    vscode.Uri.file(workingFile),
                    fileName + ' (WebDAV Compare)',
                    {
                        preview: false, // Open the diff in an additional tab instead of replacing the current one
                        selection: null // Don't select any text in the compare
                    });

            } catch (error) {
                console.log(error);
            }
        });
    });
}

function doWebdavAction(webdavAction) {
    const workingFile = vscode.window.activeTextEditor.document.uri.fsPath;
    const workingDir = workingFile.slice(0, workingFile.lastIndexOf(path.sep));

    // Read configuration
    const config = getEndpointConfigForCurrentPath(workingDir);

    // Ignore SSL errors, needed for self signed certificates
    if (config.remoteEndpoint.ignoreSSLErrors) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    // Initialize WebDAV
    const remoteFile = workingFile.replace(/\\/g, '/').replace(vscode.workspace.rootPath.replace(/\\/g, '/') + config.localRootPath, ''); // On Windows replace \ with /

    getWebdavCredentials(config.remoteEndpoint.url).then(function(credentials) {

        if (credentials !== undefined) {
            const webdav =   require("webdav-fs")(config.remoteEndpoint.url, credentials._username, credentials._password);
            webdavAction(webdav, workingFile, remoteFile);
            return;
        }

        // Credentials have not yet been stored, store them and try to retrieve them again...
        askAndStoreCredentials(config.remoteEndpoint.url).then(function() {
            getWebdavCredentials(config.remoteEndpoint.url).then(function(credentials) {
                const webdav =   require("webdav-fs")(config.remoteEndpoint.url, credentials._username, credentials._password);
                webdavAction(webdav, workingFile, remoteFile);
            });
        });
    }, function(err) {
        console.log(err);
    });
}

function getEndpointConfigForCurrentPath(absoluteWorkingDir) {
    const configFile = findConfig('webdav.json', {cwd: absoluteWorkingDir});

    if (configFile != null) {
        var allEndpointsConfig = JSON.parse(fs.readFileSync(configFile));

        var endpointConfigDirectory = configFile.slice(0, configFile.lastIndexOf(path.sep));

        const relativeWorkingDir = absoluteWorkingDir.slice(endpointConfigDirectory.length).replace(/\\/g, '/'); // On Windows replace \ with /

        let endpointConfig = null;
        let currentSearchPath = relativeWorkingDir;
        let configOnCurrentSearchPath = null;

        while (!endpointConfig) {

            if (currentSearchPath === "") {
                vscode.window.showErrorMessage('Cannot find a remote endpoint configuration for the current working directory ' + relativeWorkingDir + ' in webdav.json...');
                return null;
            }

            configOnCurrentSearchPath = allEndpointsConfig[currentSearchPath];

            if (configOnCurrentSearchPath) {
                endpointConfig = configOnCurrentSearchPath;
            } else {
                currentSearchPath = currentSearchPath.slice(0, currentSearchPath.lastIndexOf("/"));
            }
        }

        return {
            localRootPath: currentSearchPath,
            remoteEndpoint: endpointConfig
        }
    } else {
        vscode.window.showErrorMessage('Endpoint config file for WebDAV (webdav.json) not found...');
    }
}

function getWebdavCredentials(url) {
    return credStore.GetCredential(url);
}

function askAndStoreCredentials(url) {
    return new Promise(function(resolve, reject) {
        vscode.window.showInputBox({prompt: 'Username?'}).then(function(username) {
            vscode.window.showInputBox({prompt: 'Password?', password: true}).then(function(password) {
                credStore.SetCredential(url, username, password).then(function() {
                    resolve();
                });
            });
        });
    });
}