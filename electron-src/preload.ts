
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  register: (data: any) => ipcRenderer.invoke('auth:register', data),
  login: (credentials: any) => ipcRenderer.invoke('auth:login', credentials),
  getStats: () => ipcRenderer.invoke('db:getStats'),
  getMembers: (query: string) => ipcRenderer.invoke('db:getMembers', query),
  addMember: (data: any) => ipcRenderer.invoke('db:addMember', data),
  getFinances: () => ipcRenderer.invoke('db:getFinances'),
  addFinance: (data: any) => ipcRenderer.invoke('db:addFinance', data),
  getEvents: () => ipcRenderer.invoke('db:getEvents'),
  addEvent: (data: any) => ipcRenderer.invoke('db:addEvent', data),
  getBaptisms: () => ipcRenderer.invoke('db:getBaptisms'),
  addBaptism: (data: any) => ipcRenderer.invoke('db:addBaptism', data),
  getPastoralCare: () => ipcRenderer.invoke('db:getPastoralCare'),
  addPastoralRecord: (data: any) => ipcRenderer.invoke('db:addPastoralRecord', data),
  getAttendance: () => ipcRenderer.invoke('db:getAttendance'),
  saveAttendance: (data: any) => ipcRenderer.invoke('db:saveAttendance', data),
  getAnnouncements: () => ipcRenderer.invoke('db:getAnnouncements'),
  addAnnouncement: (data: any) => ipcRenderer.invoke('db:addAnnouncement', data),
  updateAnnouncementStatus: (id: string, status: string) => ipcRenderer.invoke('db:updateAnnouncementStatus', id, status),
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  updateSettings: (data: any) => ipcRenderer.invoke('db:updateSettings', data),
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  importDatabase: (json: string) => ipcRenderer.invoke('db:import', json),
});
