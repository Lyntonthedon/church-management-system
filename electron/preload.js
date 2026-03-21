"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    register: (data) => electron_1.ipcRenderer.invoke('auth:register', data),
    login: (credentials) => electron_1.ipcRenderer.invoke('auth:login', credentials),
    getStats: () => electron_1.ipcRenderer.invoke('db:getStats'),
    getMembers: (query) => electron_1.ipcRenderer.invoke('db:getMembers', query),
    addMember: (data) => electron_1.ipcRenderer.invoke('db:addMember', data),
    getFinances: () => electron_1.ipcRenderer.invoke('db:getFinances'),
    addFinance: (data) => electron_1.ipcRenderer.invoke('db:addFinance', data),
    getEvents: () => electron_1.ipcRenderer.invoke('db:getEvents'),
    addEvent: (data) => electron_1.ipcRenderer.invoke('db:addEvent', data),
    getBaptisms: () => electron_1.ipcRenderer.invoke('db:getBaptisms'),
    addBaptism: (data) => electron_1.ipcRenderer.invoke('db:addBaptism', data),
    getPastoralCare: () => electron_1.ipcRenderer.invoke('db:getPastoralCare'),
    addPastoralRecord: (data) => electron_1.ipcRenderer.invoke('db:addPastoralRecord', data),
    getAttendance: () => electron_1.ipcRenderer.invoke('db:getAttendance'),
    saveAttendance: (data) => electron_1.ipcRenderer.invoke('db:saveAttendance', data),
    getAnnouncements: () => electron_1.ipcRenderer.invoke('db:getAnnouncements'),
    addAnnouncement: (data) => electron_1.ipcRenderer.invoke('db:addAnnouncement', data),
    updateAnnouncementStatus: (id, status) => electron_1.ipcRenderer.invoke('db:updateAnnouncementStatus', id, status),
    getSettings: () => electron_1.ipcRenderer.invoke('db:getSettings'),
    updateSettings: (data) => electron_1.ipcRenderer.invoke('db:updateSettings', data),
    backupDatabase: () => electron_1.ipcRenderer.invoke('db:backup'),
    importDatabase: (json) => electron_1.ipcRenderer.invoke('db:import', json),
});
