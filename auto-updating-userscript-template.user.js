// ==UserScript==
// @name         Auto Updating Userscript Template
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @description  Sample template for auto updating userscript
// @author       firlin123
// @match        https://example.com/
// @icon         https://icons.duckduckgo.com/ip2/example.com.ico
// @grant        none
// @run-at       document-start
// @homepage     https://firlin123.github.io
// @updateURL    https://firlin123.github.io/auto-updating-userscript-template/auto-updating-userscript-template.user.js
// @downloadURL  https://firlin123.github.io/auto-updating-userscript-template/auto-updating-userscript-template.user.js
// ==/UserScript==

(function () {
    let scriptName = 'autoUpdatingUserscriptTemplate';
    let scriptVersion = {
        major: 0,
        minor: 0,
        patch: 3
    };
    let scriptUpdateUrl = 'https://firlin123.github.io/auto-updating-userscript-template/auto-updating-userscript-template.user.js';

    function main(name, fromLocalStorage, updateUrl) {
        'use strict';
        console.log('Main starting...' + (fromLocalStorage ? ' (fromLocalStorage)' : ''));
        console.log('Hello from Main V0.0.3');

        // OnUpdate callback
        window[name + 'OnUpdate'] = function onUpdate(updateVersion, changeLog) {
            console.log('New Version: ' + versionToString(updateVersion));
            console.log('Changes:');
            console.log(changeLog.map(a =>
                `${versionToString(a.version)}:\n${a.changes.map(b => ' * ' + b).join('\n')}`
            ).join('\n'));
        }
        // Begin auto update
        window.addEventListener('load', function load() {
            let scr = document.createElement('script');
            let updUrlObj = new URL(updateUrl);
            updUrlObj.searchParams.set('_', Date.now());
            scr.src = updUrlObj.toString();
            document.body.append(scr);
        });
        function versionToString(version) {
            return `v${version.major}.${version.minor}.${version.patch}`;
        }
    }

    let scriptChangeLog = [
        {
            version: { major: 0, minor: 0, patch: 2 }, changes: [
                'Fixed bug',
                'Improved UI',
                'Etc...'
            ]
        },
        {
            version: { major: 0, minor: 0, patch: 3 }, changes: [
                'Another update',
            ]
        },
    ];

    // ======== Auto update code  ======== //

    // Already running from userscript/localStorage
    if (window[scriptName + 'Version'] != null) {
        if (isVersion(window[scriptName + 'Version'])) {
            let runningVersion = window[scriptName + 'Version'];
            let loadedVersion = scriptVersion;
            let versionDiff = versionsCompare(loadedVersion, runningVersion);
            // loadedVersion > runningVersion
            if (versionDiff === 1) {
                saveToLocalStorage(main, loadedVersion);
                if (typeof window[scriptName + 'OnUpdate'] === 'function') {
                    let changeLog = filterChangeLog(runningVersion, loadedVersion);
                    window[scriptName + 'OnUpdate'](loadedVersion, changeLog);
                }
            }
        }
    }
    else {
        let { localStorageVersion, localStorageMain } = getFromLocalStorage();
        let userScriptVersion = scriptVersion;
        if (localStorageVersion != null && localStorageMain != null) {
            let versionDiff = versionsCompare(localStorageVersion, userScriptVersion);
            //localStorageVersion > userScriptVersion
            if (versionDiff === 1) {
                window[scriptName + 'Version'] = localStorageVersion;
                localStorageMain(scriptName, true, scriptUpdateUrl);
            }
            else {
                deleteFromLocalStorage();
                window[scriptName + 'Version'] = userScriptVersion;
                main(scriptName, false, scriptUpdateUrl);
            }
        }
        else {
            window[scriptName + 'Version'] = userScriptVersion;
            main(scriptName, false, scriptUpdateUrl);
        }

    }

    function isVersion(version) {
        if (version != null) {
            return (
                Object.keys(version).length === 3 &&
                typeof version.major === 'number' &&
                typeof version.minor === 'number' &&
                typeof version.patch === 'number'
            );
        }
        else return false;
    }

    //version1 > version2 === 1
    //version1 = version2 === 0
    //version1 < version2 === -1
    function versionsCompare(version1, version2) {
        if (version1.major === version2.major) {
            if (version1.minor === version2.minor) {
                if (version1.patch === version2.patch) return 0;
                else return version1.patch > version2.patch ? 1 : -1;
            }
            else return version1.minor > version2.minor ? 1 : -1;
        }
        else return version1.major > version2.major ? 1 : -1;
    }

    function saveToLocalStorage(mainFunc, version) {
        try {
            let prevMain = localStorage.getItem(scriptName + 'Main');
            localStorage.setItem(scriptName + 'Main', mainFunc.toString());
            try {
                localStorage.setItem(scriptName + 'Version', JSON.stringify(version));
            }
            catch (e) {
                console.error('saveToLocalStorage failed:', e);
                if (prevMain != null) {
                    try {
                        localStorage.setItem(scriptName + 'Main', prevMain);
                    }
                    catch (e2) { }
                }
            }
        }
        catch (e) {
            console.error('saveToLocalStorage failed:', e);
        }
    }

    function filterChangeLog(runningVersion, loadedVersion) {
        return scriptChangeLog.filter((logEntry) => {
            return (
                //logEntry.version > runningVersion
                versionsCompare(logEntry.version, runningVersion) === 1 &&
                //logEntry.version <= loadedVersion
                versionsCompare(logEntry.version, loadedVersion) !== 1
            );
        });
    }

    function getFromLocalStorage() {
        let localStorageVersion = parseVersionOrNull(localStorage.getItem(scriptName + 'Version'));
        let localStorageMain = parseFunctionOrNull(localStorage.getItem(scriptName + 'Main'));
        if (localStorageVersion != null && localStorageMain != null)
            return { localStorageVersion, localStorageMain };
        else
            return { localStorageVersion: null, localStorageMain: null };
    }

    function parseVersionOrNull(str) {
        try {
            let version = JSON.parse(str);
            return isVersion(version) ? version : null;
        }
        catch (e) {
            return null;
        }
    }

    function parseFunctionOrNull(str) {
        try {
            let func = window.eval('(' + str + ')');
            return typeof func === 'function' ? func : null;
        }
        catch (e) {
            return null;
        }
    }

    function deleteFromLocalStorage() {
        localStorage.removeItem(scriptName + 'Main');
        localStorage.removeItem(scriptName + 'Version');
    }
})();