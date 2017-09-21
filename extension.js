var vscode = require('vscode');
var fs = require("fs");

var configFile = vscode.workspace.rootPath + "/.vscode/dotcms-webdav.json";

const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5);

if (fs.existsSync(configFile)) {
    var config = JSON.parse(fs.readFileSync(configFile));

    if (config != null) {

        var wfs = require("webdav-fs")(
            config.url,
            config.user,
            config.password
        );

        if (config.ignoreSSLErrors) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }

        // this method is called when your extension is activated
        // your extension is activated the very first time the command is executed
        function activate(context) {

            var uploadCommand = vscode.commands.registerCommand('extension.dotcmsUpload', dotcmsUpload);


            statusBar.command = 'extension.dotcmsUpload';
            statusBar.text = '$(cloud-upload) Upload to dotCMS';

            context.subscriptions.push(statusBar);
            context.subscriptions.push(uploadCommand);

            statusBar.show();
        }

        exports.activate = activate;

        // this method is called when your extension is deactivated
        function deactivate() {
        }

        exports.deactivate = deactivate;
    }
}

function dotcmsUpload() {
    var editor = vscode.window.activeTextEditor;
    var webdavRoot = "d:\\workspaces\\eclipse-neon\\badinbeeld\\frontend\\badinbeeld\\www";
    var webdavPath = editor.document.uri.fsPath.replace(webdavRoot, '').replace(/\\/g, '/');
    var fileText = editor.document.getText();

    wfs.writeFile(webdavPath, fileText, function(err) {
        if (err != null) {
            console.error(err.message);
            vscode.window.showInformationMessage('Failed to upload file to dotCMS: ' + err.message);
        } else {
            var fileName = webdavPath.slice(webdavPath.lastIndexOf('/')+1);

            statusBar.text = "$(cloud-upload) Uploaded " + fileName + "...";
            statusBar.command = null;

            setTimeout(function() {
                statusBar.text = '$(cloud-upload) Upload to dotCMS';
                statusBar.command = 'extension.dotcmsUpload';
            }, 2000)
        }
    });
}