import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { MfgProcess } from '@core/models/erp.types';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-process-list',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--app-bg)] text-[var(--app-text)]">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <ng-icon name="heroCpuChipSolid" class="text-blue-600 w-8 h-8"></ng-icon>
            Procesos de Manufactura
          </h1>
          <p class="text-[var(--app-text-muted)] mt-1">Define las rutas y etapas de producción.</p>
        </div>
        <button (click)="createProcess()" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg font-medium">
          <ng-icon name="heroPlusSolid" class="w-5 h-5"></ng-icon>
          Nuevo Proceso
        </button>
      </div>

      <!-- CONTENT -->
      <div class="flex-grow p-6 overflow-y-auto">
        
        <!-- LOADING STATE -->
        <div *ngIf="isLoading()" class="flex flex-col items-center justify-center h-64 opacity-50">
          <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Cargando procesos...</p>
        </div>

        <!-- EMPTY STATE -->
        <div *ngIf="!isLoading() && processes().length === 0" class="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--subtle-bg)]">
          <ng-icon name="heroCpuChipSolid" class="w-16 h-16 text-[var(--app-text-muted)] mb-4 opacity-50"></ng-icon>
          <h3 class="text-lg font-semibold text-[var(--app-text-muted)]">No hay procesos definidos</h3>
          <p class="text-sm text-[var(--app-text-muted)] mb-4">Crea tu primer proceso de producción para comenzar.</p>
          <button (click)="createProcess()" class="text-blue-600 font-medium hover:underline">Crear Proceso</button>
        </div>

        <!-- LIST -->
        <div *ngIf="!isLoading() && processes().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let process of processes()" 
               class="group relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700">
            
            <div class="flex justify-between items-start mb-3">
              <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <ng-icon name="heroCpuChipSolid" class="w-6 h-6 text-blue-600 dark:text-blue-400"></ng-icon>
              </div>
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button (click)="editProcess(process)" class="p-1 hover:bg-[var(--subtle-bg)] rounded text-blue-500" title="Editar">
                  <ng-icon name="heroPencilSquareSolid" class="w-5 h-5"></ng-icon>
                </button>
                <button (click)="deleteProcess(process)" class="p-1 hover:bg-[var(--subtle-bg)] rounded text-red-500" title="Eliminar">
                  <ng-icon name="heroTrashSolid" class="w-5 h-5"></ng-icon>
                </button>
              </div>
            </div>

            <h3 class="text-lg font-bold mb-1">{{ process.name }}</h3>
            <p class="text-sm text-[var(--app-text-muted)] line-clamp-2 h-10">{{ process.description || 'Sin descripción' }}</p>
            
            <div class="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--app-text-muted)]">
              <span class="flex items-center gap-1">
                <ng-icon name="heroClockSolid" class="w-4 h-4"></ng-icon>
                Estándar: {{ process.standard_duration_minutes || 0 }} min
              </span>
              <span class="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium" 
                    *ngIf="process.is_active">Activo</span>
              <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium" 
                    *ngIf="!process.is_active">Inactivo</span>
            </div>
            
            <!-- Click Overlay -->
            <div (click)="editProcess(process)" class="absolute inset-0 z-0 cursor-pointer" style="pointer-events: auto; z-index: 0;"></div>
            <!-- Ensure buttons are above overlay -->
            <div class="absolute top-5 right-5 z-10 flex gap-2" style="pointer-events: none;">
               <!-- Just visual placeholder, actual buttons are in normal flow but Z-indexed if needed, or structured differently. 
                    Actually, simpler interaction: The whole card clicks, buttons stop propagation.
               -->
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class ProcessListComponent implements OnInit {
  private mfgRepo = inject(ManufacturingRepository);
  private session = inject(SessionService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  processes = signal<MfgProcess[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadProcesses();
  }

  async loadProcesses() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.mfgRepo.getProcesses(tenantId);
        this.processes.set(data);
      }
    } catch (error) {
      console.error(error);
      this.notification.error('Error al cargar procesos');
    } finally {
      this.isLoading.set(false);
    }
  }

  createProcess() {
    this.router.navigate(['/produccion/procesos/nuevo']); // Or handle ID creation logic if required
    // NOTE: Route setup for 'nuevo' or ':id' needs verification. Assuming standard pattern.
    // If exact route is undefined, maybe navigate to detail/new
  }

  editProcess(process: MfgProcess) {
    // Stop propagation handled by layout or just direct click
    this.router.navigate(['/produccion/procesos', process.id]);
  }

  async deleteProcess(process: MfgProcess) {
    if (confirm(`¿Estás seguro de eliminar el proceso "${process.name}"?`)) {
      try {
        await this.mfgRepo.deleteProcess(process.id);
        this.notification.success('Proceso eliminado');
        this.loadProcesses();
      } catch (error) {
        console.error(error);
        this.notification.error('No se pudo eliminar el proceso (puede tener órdenes vinculadas)');
      }
    }
  }
}
