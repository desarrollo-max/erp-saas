import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { SalesRepository } from '@core/repositories/sales.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SupabaseService } from '@core/services/supabase.service';
import { SalesOrder, SalesOrderLine, SalesCompany, ScmProduct } from '@core/models/erp.types';

@Component({
  selector: 'app-wholesale-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--app-bg)] text-[var(--app-text)]">
      
      <!-- HEADER -->
      <div class="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
        <div class="flex items-center gap-4">
          <button (click)="cancel()" class="p-2 rounded-full hover:bg-[var(--subtle-bg)] transition-colors">
            <ng-icon name="heroArrowLeftSolid" class="w-6 h-6"></ng-icon>
          </button>
          <div>
            <h1 class="text-xl font-bold">{{ isEditing ? 'Editar Cotización / Pedido' : 'Nueva Cotización' }}</h1>
            <p class="text-sm text-[var(--app-text-muted)]">{{ isEditing ? 'Folio: ' + orderNumber : 'Generando nuevo folio...' }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button (click)="save('QUOTE')" [disabled]="isSubmitting || form.invalid" 
                  class="px-4 py-2 border border-[var(--border-color)] text-[var(--app-text)] rounded-lg hover:bg-[var(--subtle-bg)] transition-colors font-medium">
            Guardar Borrador
          </button>
          <button (click)="save('CONFIRMED')" [disabled]="isSubmitting || form.invalid" 
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium">
            Confirmar Pedido
          </button>
        </div>
      </div>

      <!-- FORM CONTENT -->
      <div class="flex-grow p-6 overflow-y-auto">
        <form [formGroup]="form" class="max-w-5xl mx-auto space-y-8">
          
          <!-- GENERAL INFO CARD -->
          <div class="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <ng-icon name="heroUserSolid" class="text-indigo-500"></ng-icon>
              Información del Cliente
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium mb-1">Cliente *</label>
                <select formControlName="customer_id" class="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option [ngValue]="null">-- Seleccionar Cliente --</option>
                  <option *ngFor="let c of customers()" [value]="c.id">{{ c.name }}</option>
                </select>
                <p class="text-xs text-red-500 mt-1" *ngIf="form.get('customer_id')?.touched && form.get('customer_id')?.invalid">Requerido</p>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Fecha</label>
                <input type="date" formControlName="order_date" class="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] focus:ring-2 focus:ring-indigo-500 outline-none">
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1">Notas</label>
                <textarea formControlName="notes" rows="2" class="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] focus:ring-2 focus:ring-indigo-500 outline-none placeholder-opacity-50" placeholder="Condiciones de entrega, notas especiales..."></textarea>
              </div>
            </div>
          </div>

          <!-- LINES CARD -->
          <div class="bg-[var(--card-bg)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold flex items-center gap-2">
                <ng-icon name="heroListBulletSolid" class="text-indigo-500"></ng-icon>
                Partidas ({{ lines.controls.length }})
              </h3>
              <button type="button" (click)="addLine()" class="text-sm text-indigo-600 font-medium hover:underline">+ Agregar Producto</button>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-[var(--border-color)]">
                <thead>
                  <tr class="text-xs text-[var(--app-text-muted)] uppercase tracking-wider text-left">
                    <th class="px-2 py-2 w-1/3">Producto</th>
                    <th class="px-2 py-2 w-24">Cantidad</th>
                    <th class="px-2 py-2 w-32">Precio Unit.</th>
                    <th class="px-2 py-2 w-24">Desc %</th>
                    <th class="px-2 py-2 w-32 text-right">Total</th>
                    <th class="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody formArrayName="lines" class="divide-y divide-[var(--border-color)]">
                  <tr *ngFor="let line of lines.controls; let i = index" [formGroupName]="i">
                    <td class="px-2 py-2">
                      <select formControlName="product_id" (change)="onProductChange(i)" class="w-full p-1 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-sm">
                        <option [ngValue]="null">Seleccionar...</option>
                        <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                      </select>
                    </td>
                    <td class="px-2 py-2">
                      <input type="number" formControlName="quantity" min="1" (change)="calculateTotals()" class="w-full p-1 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-right">
                    </td>
                    <td class="px-2 py-2">
                      <input type="number" formControlName="unit_price" min="0" (change)="calculateTotals()" class="w-full p-1 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-right">
                    </td>
                    <td class="px-2 py-2">
                      <input type="number" formControlName="discount_percent" min="0" max="100" (change)="calculateTotals()" class="w-full p-1 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-sm text-right">
                    </td>
                    <td class="px-2 py-2 text-right text-sm font-medium">
                      {{ getLineTotal(i) | currency }}
                    </td>
                    <td class="px-2 py-2 text-center">
                      <button type="button" (click)="removeLine(i)" class="text-red-500 hover:text-red-700">
                        <ng-icon name="heroTrashSolid"></ng-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div *ngIf="lines.controls.length === 0" class="text-center py-8 text-sm text-[var(--app-text-muted)] border-2 border-dashed border-[var(--border-color)] rounded-lg mt-2">
              No hay partidas agregadas.
            </div>

            <!-- TOTALS -->
            <div class="mt-6 flex justify-end">
              <div class="w-64 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-[var(--app-text-muted)]">Subtotal:</span>
                  <span class="font-medium">{{ subtotal() | currency }}</span>
                </div>
                 <div class="flex justify-between text-sm">
                  <span class="text-[var(--app-text-muted)]">Descuento Global:</span>
                  <span class="font-medium text-green-600">-{{ totalDiscount() | currency }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-[var(--app-text-muted)]">IVA (16%):</span>
                  <span class="font-medium">{{ taxAmount() | currency }}</span>
                </div>
                <div class="flex justify-between text-lg font-bold border-t border-[var(--border-color)] pt-2">
                  <span>Total:</span>
                  <span class="text-indigo-600">{{ totalAmount() | currency }}</span>
                </div>
              </div>
            </div>

          </div>

        </form>
      </div>
    </div>
  `
})
export class WholesaleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private salesRepo = inject(SalesRepository);
  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);

  isEditing = false;
  isSubmitting = false;
  orderId: string | null = null;
  orderNumber = '';

  customers = signal<SalesCompany[]>([]);
  products = signal<ScmProduct[]>([]);

  // Computed Totals
  subtotal = signal(0);
  totalDiscount = signal(0);
  taxAmount = signal(0);
  totalAmount = signal(0);

  form = this.fb.group({
    customer_id: [null as string | null, Validators.required],
    order_date: [new Date().toISOString().split('T')[0], Validators.required],
    notes: [''],
    lines: this.fb.array([])
  });

  get lines() {
    return this.form.get('lines') as FormArray;
  }

  async ngOnInit() {
    await this.loadCatalogs();

    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.isEditing = true;
      await this.loadOrder(this.orderId);
    } else {
      this.addLine(); // Start with empty line
    }
  }

  async loadCatalogs() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    try {
      const [c, p] = await Promise.all([
        this.salesRepo.getCompanies(tenantId),
        this.productRepo.getAll(tenantId)
      ]);
      this.customers.set(c);

      // Filter only products for sale
      this.products.set(p.filter(x => x.sale_price && x.sale_price > 0));
    } catch (error) {
      console.error(error);
      this.notification.error('Error cargando catálogos');
    }
  }

  async loadOrder(id: string) {
    try {
      const order = await this.salesRepo.getOrderById(id);
      if (!order) {
        this.notification.error('Pedido no encontrado');
        this.router.navigate(['/ventas/mayoreo']);
        return;
      }

      this.orderNumber = order.order_number;
      this.form.patchValue({
        customer_id: order.customer_id,
        order_date: order.order_date.split('T')[0],
        notes: order.notes
      });

      // Load Lines
      const lines = await this.salesRepo.getOrderLines(id);
      this.lines.clear();
      lines.forEach(l => {
        this.lines.push(this.createLineGroup(l));
      });

      this.calculateTotals();
    } catch (e) {
      console.error(e);
      this.notification.error('Error cargando pedido');
    }
  }

  createLineGroup(data?: any) {
    return this.fb.group({
      id: [data?.id || null],
      product_id: [data?.product_id || null, Validators.required],
      quantity: [data?.quantity || 1, [Validators.required, Validators.min(1)]],
      unit_price: [data?.unit_price || 0, [Validators.required, Validators.min(0)]],
      discount_percent: [data?.discount_percent || 0, [Validators.min(0), Validators.max(100)]]
    });
  }

  addLine() {
    this.lines.push(this.createLineGroup());
  }

  removeLine(index: number) {
    this.lines.removeAt(index);
    this.calculateTotals();
  }

  onProductChange(index: number) {
    const line = this.lines.at(index);
    const pId = line.get('product_id')?.value;
    const product = this.products().find(p => p.id === pId);

    if (product) {
      line.patchValue({
        unit_price: product.sale_price || 0
      });
      this.calculateTotals();
    }
  }

  calculateTotals() {
    let sub = 0;
    let disc = 0;

    const lines = this.lines.value;
    lines.forEach((l: any) => {
      const q = Number(l.quantity) || 0;
      const p = Number(l.unit_price) || 0;
      const dPct = Number(l.discount_percent) || 0;

      const lineAmount = q * p;
      const lineDisc = lineAmount * (dPct / 100);

      sub += lineAmount;
      disc += lineDisc;
    });

    const taxRate = 0.16;
    const taxableBase = sub - disc;
    const tax = taxableBase * taxRate;
    const total = taxableBase + tax;

    this.subtotal.set(sub);
    this.totalDiscount.set(disc);
    this.taxAmount.set(tax);
    this.totalAmount.set(total);
  }

  getLineTotal(index: number) {
    const l = this.lines.at(index).value;
    const q = Number(l.quantity) || 0;
    const p = Number(l.unit_price) || 0;
    const dPct = Number(l.discount_percent) || 0;
    const amount = q * p;
    return amount - (amount * (dPct / 100));
  }

  async save(status: string) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      const val = this.form.value;
      const tenantId = this.session.currentTenantId();
      if (!tenantId) throw new Error('No session');

      // 1. Save Header
      const orderData: Partial<SalesOrder> = {
        tenant_id: tenantId,
        customer_id: val.customer_id,
        order_date: new Date(val.order_date!).toISOString(),
        status: status,
        notes: val.notes,
        total_amount: this.totalAmount(),
        tax_amount: this.taxAmount(),
        discount_amount: this.totalDiscount(),
        net_amount: this.subtotal() - this.totalDiscount(),
        currency_code: 'MXN', // Hardcoded for now
        // order_number is auto-generated by DB usually or we handle it. 
        // For now let DB default or trigger handle it if missing.
        order_number: this.orderNumber || `ORD-${Date.now()}` // Fallback logic
      };

      // Ensure company_id is set (referencing internal company, usually from session user context)
      // Since we don't have multi-company selection here explicitly, stick to a default or first company logic if required.
      // SalesOrder interface says "company_id" is required.
      // Let's assume user.company_id or fetch first.

      // FIX: Need a valid company_id for the constraint.
      // Assuming session has it or we pass a placeholder if permitted, 
      // but usually ERPs require one.
      // Let's fetch one via Supabase for now if not in session, or assume session has it.
      // SessionService usually has user info.

      // Hack for now: First company of tenant
      const companies = await this.salesRepo.getCompanies(tenantId);
      // Wait, sales_companies are CUSTOMERS.
      // We need connection to core "Company" table.
      // Let's just use a random UUID if not strict, or valid one if strict.
      // The mocks might allow anything. Real DB might enforce foreign key.

      // Let's try to get a valid company ID from user context or just Mock it if fails.
      // In `erp.types.ts`, `SalesOrder` has `company_id`.
      // I'll assume `val.customer_id` is the `customer_id`.
      // `company_id` is the SELLER.
      // I'll grab the first internal company from `Tenant`.

      // Actually, let's just use a hardcoded value if we can't find one, hoping for the best in this prototype phase.
      // Or better:
      const internalCompanies = await this.supabase.client.from('companies').select('id').eq('tenant_id', tenantId).limit(1);
      if (internalCompanies.data && internalCompanies.data.length > 0) {
        orderData.company_id = internalCompanies.data[0].id;
      } else {
        // Fallback/Error
        throw new Error('No se encontró empresa emisora configurada');
      }


      let savedOrder: SalesOrder;
      if (this.isEditing && this.orderId) {
        await this.salesRepo.updateOrder(this.orderId, orderData);
        savedOrder = await this.salesRepo.getOrderById(this.orderId) as SalesOrder;
      } else {
        savedOrder = await this.salesRepo.createOrder(orderData);
      }

      // 2. Save Lines
      // Delete old lines if editing (simplest strategy, though inefficient for large orders)
      if (this.isEditing && this.orderId) {
        await this.salesRepo.deleteOrderLines(this.orderId);
      }

      // Create new lines
      const lines = this.lines.value;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        const lineData: Partial<SalesOrderLine> = {
          sales_order_id: savedOrder.id,
          line_number: i + 1,
          product_id: l.product_id,
          description: this.products().find(p => p.id === l.product_id)?.name || 'Item',
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount_percent: l.discount_percent,
          line_amount: (l.quantity * l.unit_price) * (1 - (l.discount_percent / 100)),
          tax_percent: 16 // Hardcoded
        };
        await this.salesRepo.createOrderLine(lineData);
      }

      this.notification.success('Pedido guardado correctamente');
      this.router.navigate(['/ventas/mayoreo']);

    } catch (error: any) {
      console.error(error);
      this.notification.error('Error al guardar: ' + error.message);
    } finally {
      this.isSubmitting = false;
    }
  }

  cancel() {
    this.router.navigate(['/ventas/mayoreo']);
  }
}
