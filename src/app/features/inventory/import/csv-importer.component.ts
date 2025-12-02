import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SessionService } from '../../../core/services/session.service';
import { ScmProduct } from '../../../core/models/erp.types';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductRepository } from '../../../core/repositories/product.repository';

@Component({
  selector: 'app-csv-importer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">Importar Productos</h1>
          <p class="mt-2 text-sm text-gray-700">Sube tu CSV para carga masiva.</p>
        </div>
      </div>

      <div *ngIf="step() === 1" class="mt-8">
        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50">
          <div class="space-y-1 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="flex text-sm text-gray-600 justify-center">
              <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                <span>Sube un archivo CSV</span>
                <input id="file-upload" name="file-upload" type="file" class="sr-only" (change)="onFileSelected($event)" accept=".csv" />
              </label>
            </div>
            <p class="text-xs text-gray-500">CSV hasta 10MB</p>
          </div>
        </div>
      </div>

      <div *ngIf="step() === 2" class="mt-8">
        <h2 class="text-lg font-medium text-gray-900">Mapear Columnas</h2>
        <table class="min-w-full divide-y divide-gray-300 mt-4">
          <thead>
            <tr>
              <th scope="col" class="py-3 text-left text-sm font-semibold text-gray-900">Campo Sistema</th>
              <th scope="col" class="px-3 py-3 text-left text-sm font-semibold text-gray-900">Columna CSV</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let field of systemFields">
              <td class="whitespace-nowrap py-4 text-sm font-medium text-gray-900">{{ field }}</td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <select (change)="updateMapping(field, $any($event.target).value)" class="block w-full border-gray-300 rounded-md">
                  <option value="">-- Ignorar --</option>
                  <option *ngFor="let header of csvHeaders()" [value]="header">{{ header }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="mt-4 flex items-center">
            <input id="update-existing" name="update-existing" type="checkbox" [(ngModel)]="updateExisting" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600">
            <label for="update-existing" class="ml-2 block text-sm text-gray-900">
                Actualizar productos existentes (basado en SKU)
            </label>
        </div>

        <div class="mt-6 flex justify-end gap-x-6">
          <button (click)="step.set(1)" class="text-sm font-semibold leading-6 text-gray-900">Cancelar</button>
          <button (click)="saveData()" [disabled]="isLoading()" class="bg-indigo-600 px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {{ isLoading() ? 'Procesando...' : 'Importar' }}
          </button>
        </div>
      </div>

      <div *ngIf="step() === 3" class="mt-8 text-center">
        <div *ngIf="isLoading()">
           <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
           <p class="mt-2">Procesando...</p>
        </div>
        
        <div *ngIf="!isLoading() && importSuccess()">
           <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
           </div>
           <h2 class="mt-3 text-lg font-medium text-green-700">¡Éxito!</h2>
           
           <div class="mt-6 w-full max-w-lg mx-auto bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
             <div class="grid grid-cols-3 divide-x divide-gray-200 bg-gray-50">
               <div class="p-4 text-center">
                 <p class="text-2xl font-bold text-green-600">{{ importStats().added }}</p>
                 <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Agregados</p>
               </div>
               <div class="p-4 text-center">
                 <p class="text-2xl font-bold text-blue-600">{{ importStats().updated }}</p>
                 <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Actualizados</p>
               </div>
               <div class="p-4 text-center">
                 <p class="text-2xl font-bold text-red-600">{{ importStats().failed }}</p>
                 <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Fallidos</p>
               </div>
             </div>
             
             <div *ngIf="importStats().errors.length > 0" class="p-4 border-t border-gray-200 bg-red-50">
                <p class="text-sm font-semibold text-red-800 mb-2">Detalle de Errores:</p>
                <ul class="list-disc pl-5 max-h-48 overflow-y-auto text-xs text-red-700 space-y-1 text-left">
                    <li *ngFor="let err of importStats().errors">{{ err }}</li>
                </ul>
             </div>
           </div>

           <div class="mt-6">
             <button (click)="navigateToInventory()" class="bg-indigo-600 text-white px-4 py-2 rounded shadow-sm hover:bg-indigo-700">Ver Inventario</button>
           </div>
        </div>
        
        <div *ngIf="!isLoading() && !importSuccess()">
           <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
           </div>
           <h2 class="mt-3 text-lg font-medium text-red-700">Error</h2>
           <button (click)="step.set(2)" class="mt-6 text-indigo-600 hover:text-indigo-500 font-medium">Intentar de nuevo</button>
        </div>
      </div>
    </div>
  `,
})
export class CsvImporterComponent {
  step = signal<number>(1);
  csvHeaders = signal<string[]>([]);
  csvData = signal<string[][]>([]);
  mappedColumns = signal<Map<string, string>>(new Map());
  isLoading = signal<boolean>(false);
  importSuccess = signal<boolean>(false);
  updateExisting = false;
  importStats = signal<{ added: number; updated: number; failed: number; errors: any[] }>({ added: 0, updated: 0, failed: 0, errors: [] });

  systemFields: (keyof ScmProduct)[] = [
    'sku', 'name', 'description', 'category_id', 'purchase_price', 'sale_price', 'cost_price', 'unit_type'
  ];

  // =================================================================================
  // 🔧 CONFIGURACIÓN DE IDs (FIXED)
  // =================================================================================
  private readonly DEFAULT_CATEGORY_ID = '64797ab9-5ef0-4554-a92d-9bb28139c860';
  private readonly DEFAULT_TENANT_ID = '4362be56-885e-4834-acbf-55b7ca15ac36';

  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = reader.result as string;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim());
      this.csvHeaders.set(headers);

      const data = lines.slice(1).map(line => line.split(',').map(f => f.trim()));
      this.csvData.set(data);
      this.step.set(2);
    };
    reader.readAsText(input.files[0]);
  }

  updateMapping(field: keyof ScmProduct, csvHeader: string): void {
    this.mappedColumns.update(map => {
      // CORRECCIÓN: 'as string' añadido para TypeScript estricto
      csvHeader === "" ? map.delete(field as string) : map.set(field as string, csvHeader);
      return new Map(map);
    });
  }


  async saveData(): Promise<void> {
    this.step.set(3);
    this.isLoading.set(true);
    this.importSuccess.set(false);

    // 🟢 CAMBIO FINAL: Ya no usamos el ID fijo. Usamos la sesión real.
    const tenantId = this.session.currentTenant()?.id;

    if (!tenantId) {
      this.notification.error('Error crítico: No hay ID de Empresa (Tenant).');
      this.isLoading.set(false);
      this.step.set(2);
      return;
    }

    const productsToInsert: Partial<ScmProduct>[] = [];
    const headerMap = new Map<string, number>();
    this.csvHeaders().forEach((h, i) => headerMap.set(h, i));
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    try {
      for (const row of this.csvData()) {
        const product: Partial<ScmProduct> = {
          tenant_id: tenantId,
          is_active: true,
          unit_type: 'PIECE'
        };
        let hasData = false;

        for (const [systemField, csvHeader] of this.mappedColumns().entries()) {
          const colIndex = headerMap.get(csvHeader);
          if (colIndex !== undefined && row[colIndex] !== undefined) {
            const key = systemField as keyof ScmProduct;
            let value: any = row[colIndex];

            // CORRECCIÓN: 'as string' añadido para .includes() en TS estricto
            if (['purchase_price', 'sale_price', 'cost_price'].includes(key as string)) {
              value = parseFloat(value) || 0;
            }
            if (key === 'category_id') {
              if (!value || !uuidRegex.test(value)) value = this.DEFAULT_CATEGORY_ID;
            }
            if (key === 'unit_type' && (!value || value === '')) value = 'PIECE';

            (product as any)[key] = value;
            hasData = true;
          }
        }

        // Si no se asignó categoría, usar la default
        if (!(product as any).category_id) (product as any).category_id = this.DEFAULT_CATEGORY_ID;

        if (hasData && (product.sku || product.name)) {
          productsToInsert.push(product);
        }
      }

      if (productsToInsert.length === 0) throw new Error('No hay datos válidos.');

      console.log(`Insertando ${productsToInsert.length} productos para Tenant: ${tenantId}`);

      // Llamada a través del Repositorio (Desacoplado)
      const result = await this.productRepo.createBulk(productsToInsert, this.updateExisting);

      this.importStats.set(result);
      this.importSuccess.set(true);
      this.notification.success(`Proceso completado. ${result.added + result.updated} procesados.`);
    } catch (error: any) {
      console.error(error);
      this.notification.error(error.message);
      this.importSuccess.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory']);
  }
}