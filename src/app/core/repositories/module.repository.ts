import { Module } from '../models/module.model';

export abstract class ModuleRepository {
  abstract getAllAvailable(): Promise<Module[]>;
  abstract getInstalledModules(tenantId: string): Promise<Module[]>;
  abstract installModule(tenantId: string, moduleId: string): Promise<void>;
}
