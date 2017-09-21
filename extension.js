const vscode = require('vscode');
const fs = require("fs");
const findConfig = require('find-config');
const path = require('path');

const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5);

    function activate(context) {
        var uploadCommand = vscode.commands.registerCommand('extension.webdavUpload', function(){
            const editor = vscode.window.activeTextEditor;

            const workingFile = editor.document.uri.fsPath;
            const workingDir = workingFile.slice(0, workingFile.lastIndexOf(path.sep));
            const configFile = findConfig('webdav.json', {cwd: workingDir});

            if (configFile != null) {
                // The location of the config file is the directory we use as webdav root
                const baseDir = configFile.slice(0, configFile.lastIndexOf(path.sep));

                // Read configuration
                var config = JSON.parse(fs.readFileSync(configFile));

                // Ignore SSL errors, needed for self signed certificates
                if (config.ignoreSSLErrors) {
                    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                }

                // Initialize WebDAV
                const webdav =   require("webdav-fs")(config.url, config.user, config.password);
                const remoteFile = workingFile.replace(baseDir, '').replace(/\\/g, '/'); // On Windows replace \ with /

                // Upload
                webdav.writeFile(remoteFile, editor.document.getText(), function(err) {
                    if (err != null) {
                        console.error(err);
                        vscode.window.showInformationMessage('Failed to upload file to remote host: ' + err.message);
                    } else {
                        var fileName = remoteFile.slice(remoteFile.lastIndexOf('/') + 1);

                        statusBar.text = "$(cloud-upload) Uploaded " + fileName + "...";
                        statusBar.command = null;

                        setTimeout(function() {
                            statusBar.text = '$(cloud-upload) Upload to WebDAV';
                            statusBar.command = 'extension.webdavUpload';
                        }, 2000)
                    }
                });
            }
        });

        statusBar.command = 'extension.webdavUpload';
        statusBar.text = '$(cloud-upload) Upload to WebDAV';

        context.subscriptions.push(statusBar);
        context.subscriptions.push(uploadCommand);

        statusBar.show();
    }

    exports.activate = activate;

    // this method is called when your extension is deactivated
    function deactivate() {
    }

    exports.deactivate = deactivate;
