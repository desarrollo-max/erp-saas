import { Module } from '../models/module.model';

export abstract class ModuleRepository {
  abstract getAllAvailable(): Promise<Module[]>;
  abstract getInstalledModules(clientId: string): Promise<Module[]>;
  abstract installModule(clientId: string, moduleId: string): Promise<void>;
  abstract uninstallModule(clientId: string, moduleId: string): Promise<void>;
}
