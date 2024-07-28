// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const ROOT_DOMAIN = "https://kpm.metatable.dev";
export const API_DOMAIN = `${ROOT_DOMAIN}/api/v1`;

export const defaultInstallLocation = 'knight_library';
const configFilePath = path.join(process.cwd(), 'kpm.config.json');
//export const installLocation = process.env.KPM_INSTALL_LOCATION || defaultInstallLocation;

export let installLocation: string;

if (fs.existsSync(configFilePath)) {
    installLocation = JSON.parse(fs.readFileSync(configFilePath, 'utf8')).installLocation || defaultInstallLocation;
} else {
    installLocation = process.env.KPM_INSTALL_LOCATION || defaultInstallLocation;
}

export function setInstallLocation(newLocation: string): void {
    const config = {
        installLocation: newLocation
    };

    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    installLocation = newLocation;
}