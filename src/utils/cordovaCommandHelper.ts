﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as child_process from 'child_process';
import * as Q from 'q';
import * as os from 'os';
import {window} from 'vscode';

import {TelemetryHelper} from './telemetryHelper';

export class CordovaCommandHelper {
    private static CORDOVA_CMD_NAME = os.platform() === "darwin" ? "cordova" : "cordova.cmd";

    public static executeCordovaCommand(projectRoot: string, command: string) {
        TelemetryHelper.generate('cordovaCommand', (generator) => {
            generator.add('command', command, false);
            let outputChannel = window.createOutputChannel("cordova");
            let commandToExecute = CordovaCommandHelper.CORDOVA_CMD_NAME + " " + command;
            outputChannel.appendLine("########### EXECUTING: " + commandToExecute + " ###########");
            outputChannel.show();
            let process = child_process.exec(commandToExecute, {cwd: projectRoot});

            let deferred = Q.defer();
            process.on("error", (err: any) => {
            // ENOENT error will be thrown if no Cordova.cmd is found
                if (err.code === "ENOENT") {
                    window.showErrorMessage("Cordova not found, please run 'npm install –g cordova' to install Cordova globally");
                }
                deferred.reject(err);
            });

            process.stderr.on('data', (data: any) => {
                outputChannel.append(data);
            });

            process.stdout.on('data', (data: any) => {
                outputChannel.append(data);
            });

            process.stdout.on("close", (exitCode: number) => {
                outputChannel.appendLine("########### FINISHED EXECUTING : " + commandToExecute + " ###########");
                deferred.resolve({});
            });

            return TelemetryHelper.determineProjectTypes(projectRoot)
                .then((projectType) => generator.add('projectType', projectType, false))
                .then(() => deferred.promise);
        });
    }
}
