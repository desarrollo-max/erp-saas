import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HRRepository } from '@core/repositories/hr.repository';
import { HrEmployee } from '@core/models/erp.types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Empleados</h1>
        <button (click)="openModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nuevo Empleado
        </button>
      </div>

      <!-- Employee List -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let emp of employees()">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {{ emp.first_name.charAt(0) }}{{ emp.last_name.charAt(0) }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ emp.first_name }} {{ emp.last_name }}</div>
                    <div class="text-sm text-gray-500">{{ emp.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ emp.position }}</div>
                <div class="text-sm text-gray-500">{{ emp.department }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {{ emp.contract_type || 'N/A' }}
                </span>
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ emp.status }}
              </td>
            </tr>
            <tr *ngIf="employees().length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-gray-500">No hay empleados registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal (Simplified Implementation) -->
    <div *ngIf="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Nuevo Empleado</h2>
        <form (ngSubmit)="saveEmployee()" #empForm="ngForm">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
            <input [(ngModel)]="newEmployee.first_name" name="firstName" type="text" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Apellido</label>
            <input [(ngModel)]="newEmployee.last_name" name="lastName" type="text" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Tipo de Contrato</label>
            <select [(ngModel)]="newEmployee.contract_type" name="contractType" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              <option value="weekly">Semanal</option>
              <option value="bi-weekly">Quincenal</option>
              <option value="piece-rate">Destajo</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

           <!-- Custom Fields Section -->
          <div class="mb-4 border-t pt-4">
             <label class="block text-gray-700 text-sm font-bold mb-2">Campos Personalizados</label>
             <div class="flex gap-2 mb-2">
                <input [(ngModel)]="tempCustomKey" name="customKey" placeholder="Nombre (ej. Talla Uniforme)" class="shadow border rounded w-1/2 py-1 px-2 text-sm">
                <input [(ngModel)]="tempCustomValue" name="customValue" placeholder="Valor" class="shadow border rounded w-1/2 py-1 px-2 text-sm">
                <button type="button" (click)="addCustomField()" class="bg-gray-200 px-2 rounded">+</button>
             </div>
             <div *ngIf="newEmployee.custom_fields">
                <div *ngFor="let key of getCustomFieldKeys()" class="text-xs bg-gray-100 p-1 mb-1 flex justify-between">
                    <span><strong>{{key}}:</strong> {{newEmployee.custom_fields[key]}}</span>
                </div>
             </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button type="button" (click)="closeModal()" class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class EmployeesComponent {
  // private hrRepo = inject(HRRepository); // Commented out until Repo is fully implemented or mocked

  employees = signal<HrEmployee[]>([]);
  showModal = false;

  newEmployee: Partial<HrEmployee> = {
    contract_type: 'weekly',
    custom_fields: {}
  };

  tempCustomKey = '';
  tempCustomValue = '';

  constructor() {
    // Mock initial data
    this.employees.set([
      {
        id: '1',
        tenant_id: 't1',
        company_id: 'c1',
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan@example.com',
        position: 'Operador',
        department: 'Producción',
        contract_type: 'piece-rate',
        status: 'active',
        created_at: '',
        updated_at: '',
        phone: null, hire_date: null, manager_id: null, user_id: null
      }
    ]);
  }

  openModal() {
    this.showModal = true;
    this.newEmployee = { contract_type: 'weekly', custom_fields: {} };
  }

  closeModal() {
    this.showModal = false;
  }

  addCustomField() {
    if (this.tempCustomKey && this.tempCustomValue) {
      if (!this.newEmployee.custom_fields) this.newEmployee.custom_fields = {};
      this.newEmployee.custom_fields[this.tempCustomKey] = this.tempCustomValue;
      this.tempCustomKey = '';
      this.tempCustomValue = '';
    }
  }

  getCustomFieldKeys() {
    return this.newEmployee.custom_fields ? Object.keys(this.newEmployee.custom_fields) : [];
  }

  saveEmployee() {
    // In a real app, call this.hrRepo.createEmployee(...)
    const emp = { ...this.newEmployee, id: Date.now().toString(), status: 'active' } as HrEmployee;
    this.employees.update(list => [...list, emp]);
    this.closeModal();
  }
}
