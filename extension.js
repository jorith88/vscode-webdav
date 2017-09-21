var vscode = require('vscode');
var fs = require("fs");

var config = JSON.parse(fs.readFileSync(vscode.workspace.rootPath + "/.vscode/dotcms-webdav.json"));

if (config == null) {
    vscode.window.showErrorMessage("Add configuration to .vscode/dotcms-webdav.json");
    process.exit(0);
}

var wfs = require("webdav-fs")(
    config.url,
    config.user,
    config.password
);


console.log(config)


if (config.ignoreSSLErrors) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    var disposable = vscode.commands.registerCommand('extension.dotcmsUpload', function () {
        var editor = vscode.window.activeTextEditor;

        var webdavRoot = "d:\\workspaces\\eclipse-neon\\badinbeeld\\frontend\\badinbeeld\\www";
        var webdavPath = editor.document.uri.fsPath.replace(webdavRoot, '').replace(/\\/g, '/');

        var fileText = editor.document.getText();

        wfs.writeFile(webdavPath, fileText, function(err) {
            if (err != null) {
                console.error(err.message);
                vscode.window.showInformationMessage('Failed to upload file to dotCMS: ' + err.message);
            } else {
                vscode.window.showInformationMessage('Uploaded ' + webdavPath + ' to dotCMS...');
            }
        });
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;