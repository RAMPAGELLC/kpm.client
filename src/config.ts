// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import fs from 'fs';
import path from 'path';

export const ROOT_DOMAIN = "https://kpm.metatable.dev";
export const API_DOMAIN = `${ROOT_DOMAIN}/api/v1`;
export let unsafeMode = false;

export const defaultInstallLocation = 'knight_library';
export const configFilePath = path.join(process.cwd(), 'kpm.config.json');
export let installLocation: string;

if (fs.existsSync(configFilePath)) {
    installLocation = JSON.parse(fs.readFileSync(configFilePath, 'utf8')).installLocation || defaultInstallLocation;
} else {
    installLocation = process.env.KPM_INSTALL_LOCATION || defaultInstallLocation;
}

export function setUnsafe(value: boolean): void {
    unsafeMode = value;
}

export function setInstallLocation(newLocation: string): void {
    const config = {
        installLocation: newLocation
    };

    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    installLocation = newLocation;
}