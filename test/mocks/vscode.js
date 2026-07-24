'use strict';

function createSpy(defaultResolvedValue) {
    const spy = (...args) => {
        spy.calls.push(args);
        const value = spy.calls.length <= spy.__resolvedValues.length
            ? spy.__resolvedValues[spy.calls.length - 1]
            : defaultResolvedValue;
        return Promise.resolve(value);
    };
    spy.calls = [];
    spy.__resolvedValues = [];
    spy.resolveWith = value => { spy.__resolvedValues.push(value); };
    spy.reset = () => { spy.calls = []; spy.__resolvedValues = []; };
    return spy;
}

function createMock() {
    const registeredCommands = new Map();

    const vscode = {
        commands: {
            registerCommand: (name, fn) => {
                registeredCommands.set(name, fn);
                return { dispose() { registeredCommands.delete(name); } };
            },
            executeCommand: createSpy(undefined)
        },
        window: {
            activeTextEditor: undefined,
            showErrorMessage: createSpy(undefined),
            showWarningMessage: createSpy(undefined),
            showInformationMessage: createSpy(undefined),
            showInputBox: createSpy(undefined)
        },
        workspace: {
            rootPath: undefined
        },
        Uri: {
            file: p => ({ fsPath: p, scheme: 'file', toString: () => 'file://' + p })
        },
        __registeredCommands: registeredCommands,
        __reset() {
            registeredCommands.clear();
            vscode.window.activeTextEditor = undefined;
            vscode.workspace.rootPath = undefined;
            vscode.commands.executeCommand.reset();
            vscode.window.showErrorMessage.reset();
            vscode.window.showWarningMessage.reset();
            vscode.window.showInformationMessage.reset();
            vscode.window.showInputBox.reset();
        }
    };
    return vscode;
}

module.exports = { createMock };
