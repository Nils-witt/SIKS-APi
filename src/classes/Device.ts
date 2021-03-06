/*
 * Copyright (c) 2021 Nils Witt.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import {ApiGlobal} from "../types/global";
import path from "path";

declare const global: ApiGlobal;

/**
 * @typedef Device
 * @property {number} id
 * @property {string} userId.required
 * @property {DeviceType} platform.required
 * @property {number} device.required
 */
export class Device {
    public timeAdded: string;
    public id: number | null;
    public userId: number | null;
    public platform: DeviceType;
    public deviceIdentifier: string;
    public verified: boolean = true;

    constructor(platform: DeviceType, id: number | null, userId: number | null, timeAdded: string, deviceIdentifier: string) {
        this.platform = platform;
        this.id = id;
        this.userId = userId;
        this.timeAdded = timeAdded;
        this.deviceIdentifier = deviceIdentifier;
    }

    /**
     * Returns a device object
     * @param row
     */
    static fromSqlRow(row: DeviceSqlRow): Promise<Device> {
        return new Promise(async (resolve, reject) => {
            resolve(new Device(row.platform, row.id_devices, row.userId, row.added, row.deviceIdentifier));
        });
    }

    /**
     * Remove device from Database
     * @param deviceId {String}
     * @returns Promise
     */
    static removeDevice(deviceId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                await conn.query("DELETE FROM `devices` WHERE deviceIdentifier = ?", [deviceId]);
                resolve();
            } catch (e) {
                reject(e);
            } finally {
                if (conn) await conn.end()
            }
        });
    }

    static getByUID(id: number): Promise<Device[]> {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: DeviceSqlRow[] = await conn.query("SELECT * FROM devices WHERE `userId`= ?;", [id]);
                let devices: Device[] = [];

                for (let i = 0; i < rows.length; i++) {
                    if (rows[i].deviceIdentifier != null) {
                        devices.push(await this.fromSqlRow(rows[i]));
                    }
                }
                resolve(devices);
            } catch (e) {
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: Device; Function: getByUID: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
                reject(e);
            } finally {
                if (conn) await conn.end()
            }
        });
    }

    save() {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                let rows: Device[] = await conn.query("SELECT * FROM devices WHERE deviceIdentifier= ?;", [this.deviceIdentifier]);
                if (rows.length !== 0) {
                    resolve(false);
                    return
                }
                await conn.query("INSERT INTO `devices` (`userId`, deviceIdentifier, `platform`) VALUES (?, ?, ?)", [this.userId, this.deviceIdentifier, this.platform]);
                resolve(true);
            } catch (e) {
                reject(e);
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: Device; Function: addDevice: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
            } finally {
                if (conn) await conn.end();
            }
        });
    }

    delete() {
        return new Promise(async (resolve, reject) => {
            let conn;
            try {
                conn = await global.mySQLPool.getConnection();
                await conn.query("DELETE FROM devices WHERE id_devices= ?;", [this.id]);
                resolve(true);
            } catch (e) {
                reject(e);
                global.logger.log({
                    level: 'error',
                    label: 'User',
                    message: 'Class: Device; Function: delete: ' + JSON.stringify(e),
                    file: path.basename(__filename)
                });
            } finally {
                if (conn) await conn.end();
            }
        });
    }
}

export enum DeviceType {
    TELEGRAM = 0,
    APNS = 1,
    FIREBASE = 2,
    WEBPUSH = 3,
    MAIL = 4
}

export type DeviceSqlRow = {
    id_devices: number;
    userId: number
    deviceIdentifier: string;
    platform: number;
    added: string;
}