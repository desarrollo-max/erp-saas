import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LabelTemplate, LabelElement, LabelElementType } from '@core/models/label-template.model';
import { LocalLabelTemplateRepository } from '@core/repositories/implementations/local-label-template.repository';
import { NotificationService } from '@core/services/notification.service';
import { SessionService } from '@core/services/session.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-label-editor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col h-full bg-[#111218] text-white">
      <header class="h-16 flex items-center justify-between border-b border-[#272a3a] bg-[#111218] px-6 shrink-0 z-20">
        <div class="flex items-center gap-3">
          <div class="size-6 bg-primary rounded flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-sm">grid_view</span>
          </div>
          <h2 class="text-lg font-bold tracking-tight">SIAC ERP</h2>
          <span class="text-[#9ba0bb]">/</span>
          <a routerLink="/cadena-suministro/inventario" class="text-[#9ba0bb] hover:text-white transition-colors">Inventario</a>
          <span class="text-[#9ba0bb]">/</span>
          <span class="font-medium">Diseñador</span>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openInNewTab()" class="flex items-center justify-center rounded-lg h-9 px-3 bg-[#272a3a] hover:bg-[#32364a] text-white text-sm font-medium transition-colors gap-2">
            <span class="material-symbols-outlined text-lg">open_in_new</span>
            <span class="hidden sm:inline">Nueva ventana</span>
          </button>
          <button (click)="navigatePreview()" class="flex items-center justify-center rounded-lg h-9 px-3 bg-[#272a3a] hover:bg-[#32364a] text-white text-sm font-medium transition-colors gap-2">
            <span class="material-symbols-outlined text-lg">visibility</span>
            <span class="hidden sm:inline">Vista Previa</span>
          </button>
          <button (click)="manualSave()" class="flex items-center justify-center rounded-lg h-9 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all gap-2">
            <span class="material-symbols-outlined text-lg">save</span>
            <span>Guardar</span>
          </button>
          <div class="w-px h-8 bg-[#272a3a]"></div>
          <div class="text-[11px] text-[#9ba0bb] font-medium" [class.text-emerald-400]="savedRecently()">{{ saveStatus() }}</div>
        </div>
      </header>

      <main class="flex flex-1 overflow-hidden relative">
        <aside class="w-64 bg-[#111218] border-r border-[#272a3a] flex flex-col z-10 shrink-0">
          <div class="p-4 border-b border-[#272a3a]">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#9ba0bb] mb-1">Herramientas</h3>
            <p class="text-xs text-slate-500">Elementos de diseño</p>
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-1">
            <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#272a3a] text-white">
              <span class="material-symbols-outlined">near_me</span>
              <span class="text-sm font-medium">Seleccionar</span>
            </button>
            <div class="pt-4 pb-2 px-1">
              <p class="text-[10px] font-bold uppercase text-[#9ba0bb] mb-2">Básicos</p>
            </div>
            <button (click)="addElement('text')" class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1b2132] text-[#9ba0bb] hover:text-white">
              <span class="material-symbols-outlined group-hover:text-primary">title</span>
              <span class="text-sm font-medium">Texto</span>
            </button>
            <button (click)="addElement('shape')" class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1b2132] text-[#9ba0bb] hover:text-white">
              <span class="material-symbols-outlined group-hover:text-primary">check_box_outline_blank</span>
              <span class="text-sm font-medium">Rectángulo</span>
            </button>
            <div class="pt-4 pb-2 px-1">
              <p class="text-[10px] font-bold uppercase text-[#9ba0bb] mb-2">Datos y Medios</p>
            </div>
            <button (click)="addElement('image')" class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1b2132] text-[#9ba0bb] hover:text-white">
              <span class="material-symbols-outlined group-hover:text-primary">image</span>
              <span class="text-sm font-medium">Imagen</span>
            </button>
            <button (click)="addElement('barcode')" class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1b2132] text-[#9ba0bb] hover:text-white">
              <span class="material-symbols-outlined group-hover:text-primary">barcode_reader</span>
              <span class="text-sm font-medium">Código de Barras</span>
            </button>
            <button (click)="addElement('qr')" class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1b2132] text-[#9ba0bb] hover:text-white">
              <span class="material-symbols-outlined group-hover:text-primary">qr_code_2</span>
              <span class="text-sm font-medium">Código QR</span>
            </button>
          </div>
        </aside>

        <section class="flex-1 bg-[#151926] relative flex flex-col min-w-0">
          <div class="h-12 bg-[#111218] border-b border-[#272a3a] flex items-center justify-between px-4 shrink-0">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 bg-[#272a3a] rounded-md p-1">
                <button (click)="undo()" class="p-1 hover:bg-white/10 rounded text-[#9ba0bb]">
                  <span class="material-symbols-outlined text-lg">undo</span>
                </button>
                <button (click)="redo()" class="p-1 hover:bg-white/10 rounded text-[#9ba0bb]">
                  <span class="material-symbols-outlined text-lg">redo</span>
                </button>
              </div>
              <div class="h-4 w-px bg-[#272a3a]"></div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-lg text-[#9ba0bb]">zoom_in</span>
                <span class="text-xs font-mono text-[#9ba0bb]">{{ zoom() }}%</span>
                <input type="range" min="10" max="200" [value]="zoom()" (input)="onZoom($any($event.target).value)" class="w-24 h-1 bg-[#272a3a] rounded-lg appearance-none cursor-pointer accent-primary" />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [checked]="showGrid()" (change)="toggleGrid($any($event.target).checked)" class="rounded text-primary border-[#272a3a] bg-transparent w-4 h-4" />
                <span class="text-xs text-[#9ba0bb] font-medium">Mostrar cuadrícula</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" [checked]="snapToGrid()" (change)="toggleSnap($any($event.target).checked)" class="rounded text-primary border-[#272a3a] bg-transparent w-4 h-4" />
                <span class="text-xs text-[#9ba0bb] font-medium">Imán</span>
              </label>
            </div>
          </div>

          <div class="flex-1 overflow-auto flex items-center justify-center p-10 relative" [class.grid-pattern]="showGrid()">
            <div class="relative bg-white shadow-xl" [style.width.px]="canvasWidthPx()" [style.height.px]="canvasHeightPx()" [style.transform]="'scale(' + (zoom()/100) + ')'" class="transition-transform duration-200 group border border-dashed border-slate-300">
              <div *ngFor="let el of elements(); let i = index"
                   class="absolute"
                   [style.left.px]="mmToPx(el.x)"
                   [style.top.px]="mmToPx(el.y)"
                   [style.width.px]="mmToPx(el.width)"
                   [style.height.px]="mmToPx(el.height)"
                   [class.border-2]="selectedIndex() === i"
                   [class.border-primary]="selectedIndex() === i"
                   (pointerdown)="select(i, $event)"
                   (pointermove)="onDrag($event, i)"
                   (pointerup)="endDrag()">
                <ng-container [ngSwitch]="el.type">
                  <div *ngSwitchCase="'text'" class="px-1">
                    <div [style.fontSize.px]="el.style.fontSize || 12" [style.fontWeight]="el.style.fontWeight || 'bold'" [style.textAlign]="el.style.textAlign || 'left'" [style.color]="el.style.color || '#000'" class="leading-none whitespace-nowrap">{{ resolveContent(el) }}</div>
                  </div>
                  <div *ngSwitchCase="'image'" class="w-full h-full bg-gray-200 flex items-center justify-center">
                    <img *ngIf="el.content" [src]="el.content" class="w-full h-full object-contain"/>
                    <span *ngIf="!el.content" class="material-symbols-outlined text-gray-400 text-3xl">image</span>
                  </div>
                  <div *ngSwitchCase="'barcode'" class="w-full h-full flex items-center justify-center">
                    <img [src]="barcodeCache()[el.id]" class="w-full h-full object-contain"/>
                  </div>
                  <div *ngSwitchCase="'qr'" class="w-full h-full flex items-center justify-center">
                    <img [src]="qrCache()[el.id]" class="w-full h-full object-contain"/>
                  </div>
                  <div *ngSwitchCase="'shape'" class="w-full h-full" [style.background]="el.style.backgroundColor || '#eee'" [style.border]="(el.style.borderWidth || 1) + 'px solid ' + (el.style.borderColor || '#333')" [style.borderRadius.px]="el.style.borderRadius || 0"></div>
                </ng-container>
              </div>
            </div>
          </div>

          <div class="bg-[#111218] border-t border-[#272a3a] px-4 py-1 flex justify-between items-center text-[11px] text-[#9ba0bb] shrink-0 h-8">
            <div>
              <span>X: {{ selectedX() }}mm</span>
              <span class="mx-2">|</span>
              <span>Y: {{ selectedY() }}mm</span>
            </div>
            <div>
              <span>Selección: {{ selectedType() }}</span>
              <span class="mx-2">|</span>
              <span class="text-emerald-400" *ngIf="savedRecently()">Guardado</span>
            </div>
          </div>
        </section>

        <aside class="w-80 bg-[#111218] border-l border-[#272a3a] flex flex-col z-10 shrink-0 overflow-y-auto">
          <div class="p-4 border-b border-[#272a3a] flex justify-between items-center">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#9ba0bb] mb-1">Propiedades</h3>
              <p class="text-xs text-slate-500">Editar selección</p>
            </div>
            <button (click)="deleteSelected()" class="text-[#9ba0bb] hover:text-red-500">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
          <div class="p-4 space-y-6" *ngIf="selectedIndex() !== null">
            <div class="space-y-3">
              <label class="text-xs font-semibold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-base">transform</span>
                Transformación
              </label>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Posición X</span>
                  <div class="relative">
                    <input type="number" [value]="selectedX()" (input)="updateSelected('x', +$any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                    <span class="absolute right-2 top-1.5 text-xs text-[#9ba0bb]">mm</span>
                  </div>
                </div>
                <div>
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Posición Y</span>
                  <div class="relative">
                    <input type="number" [value]="selectedY()" (input)="updateSelected('y', +$any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                    <span class="absolute right-2 top-1.5 text-xs text-[#9ba0bb]">mm</span>
                  </div>
                </div>
                <div>
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Ancho</span>
                  <div class="relative">
                    <input type="number" [value]="selectedWidth()" (input)="updateSelected('width', +$any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                    <span class="absolute right-2 top-1.5 text-xs text-[#9ba0bb]">mm</span>
                  </div>
                </div>
                <div>
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Alto</span>
                  <div class="relative">
                    <input type="number" [value]="selectedHeight()" (input)="updateSelected('height', +$any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                    <span class="absolute right-2 top-1.5 text-xs text-[#9ba0bb]">mm</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <label class="text-xs font-semibold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-base">tune</span>
                Estilo
              </label>
              <div class="grid grid-cols-2 gap-3">
                <div *ngIf="selectedType() === 'text'">
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Tamaño</span>
                  <input type="number" [value]="selectedStyle('fontSize')" (input)="updateStyle('fontSize', +$any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                </div>
                <div *ngIf="selectedType() === 'text'">
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Color</span>
                  <input type="text" [value]="selectedStyle('color') || '#000'" (input)="updateStyle('color', $any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                </div>
                <div *ngIf="selectedType() === 'shape'">
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Relleno</span>
                  <input type="text" [value]="selectedStyle('backgroundColor') || '#eee'" (input)="updateStyle('backgroundColor', $any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                </div>
                <div *ngIf="selectedType() === 'shape'">
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Borde</span>
                  <input type="text" [value]="selectedStyle('borderColor') || '#333'" (input)="updateStyle('borderColor', $any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                </div>
                <div *ngIf="selectedType() === 'shape'">
                  <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Radio</span>
                  <input type="number" [value]="selectedStyle('borderRadius') || 0" (input)="updateStyle('borderRadius', +$any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <label class="text-xs font-semibold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-base">database</span>
                Datos ERP
              </label>
              <div>
                <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Campo</span>
                <select [value]="selectedVariable() || ''" (change)="updateVariable($any($event.target).value || null)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white">
                  <option value="">Manual</option>
                  <option value="product.name">Producto</option>
                  <option value="product.sku">SKU</option>
                  <option value="product.description">Descripción</option>
                  <option value="product.sale_price">Precio</option>
                </select>
              </div>
              <div *ngIf="selectedType() === 'text'">
                <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Contenido</span>
                <input type="text" [value]="selectedContent()" (input)="updateSelected('content', $any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
              </div>
              <div *ngIf="selectedType() === 'image'">
                <span class="text-[10px] text-[#9ba0bb] uppercase font-bold block mb-1">Imagen URL</span>
                <input type="text" [value]="selectedContent()" (input)="updateSelected('content', $any($event.target).value)" class="w-full bg-[#272a3a] border border-gray-700 rounded px-2 py-1.5 text-sm text-white"/>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  `
})
export class LabelEditorComponent implements OnInit {
  private repo = inject(LocalLabelTemplateRepository);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);
  private session = inject(SessionService);

  mmFactor = 5;
  template = signal<LabelTemplate>({ id: '', name: 'Plantilla Nueva', width: 100, height: 60, elements: [], createdAt: new Date(), updatedAt: new Date() });
  elements = signal<LabelElement[]>([]);
  selectedIndex = signal<number | null>(null);
  draggingIndex: number | null = null;
  dragStart: { x: number; y: number } | null = null;
  showGrid = signal(true);
  snapToGrid = signal(true);
  zoom = signal(100);
  lastSave = signal<number>(Date.now());
  saveStatus = signal('Guardado');
  sampleProduct = signal<{ name: string; sku: string; description: string; sale_price: number }>({ name: 'Producto Demo', sku: 'SKU-12345', description: 'Descripción de ejemplo', sale_price: 199.99 });
  qrCache = signal<Record<string, string>>({});
  barcodeCache = signal<Record<string, string>>({});

  canvasWidthPx = computed(() => this.mmToPx(this.template().width));
  canvasHeightPx = computed(() => this.mmToPx(this.template().height));

  ngOnInit() {
    if (!this.session.isLoggedIn()) {
      this.notify.error('Sesión no válida. Seleccione una empresa.');
      this.router.navigate(['/companies']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.repo.getById(id).subscribe(t => {
        if (t) {
          this.template.set(t);
          this.elements.set(t.elements);
          this.updateRenderCache();
        }
      });
    } else {
      this.repo.create({ name: 'Plantilla Nueva', width: 100, height: 60, elements: [] }).subscribe(t => {
        this.template.set(t);
        this.elements.set([]);
        this.saveStatus.set('Guardado');
        this.updateRenderCache();
      });
    }
  }

  mmToPx(mm: number) { return Math.round(mm * this.mmFactor); }
  pxToMm(px: number) { return Math.round(px / this.mmFactor); }

  select(index: number, e: PointerEvent) {
    this.selectedIndex.set(index);
    this.draggingIndex = index;
    this.dragStart = { x: e.clientX, y: e.clientY };
  }

  onDrag(e: PointerEvent, index: number) {
    if (this.draggingIndex !== index || !this.dragStart) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    const el = { ...this.elements()[index] };
    const newX = this.pxToMm(this.mmToPx(el.x) + dx);
    const newY = this.pxToMm(this.mmToPx(el.y) + dy);
    el.x = this.snapToGrid() ? Math.round(newX) : newX;
    el.y = this.snapToGrid() ? Math.round(newY) : newY;
    const arr = [...this.elements()];
    arr[index] = el;
    this.elements.set(arr);
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.triggerAutoSave();
  }

  endDrag() {
    this.draggingIndex = null;
    this.dragStart = null;
  }

  addElement(type: LabelElementType) {
    const el: LabelElement = { id: crypto.randomUUID(), type, content: type === 'text' ? 'Nuevo Texto' : '', x: 10, y: 10, width: type === 'text' ? 40 : 20, height: type === 'text' ? 8 : 20, style: {}, variableField: null };
    const arr = [...this.elements()];
    arr.push(el);
    this.elements.set(arr);
    this.selectedIndex.set(arr.length - 1);
    this.pushSnapshot();
    this.triggerAutoSave();
    this.updateRenderCache();
  }

  updateSelected(field: keyof LabelElement, value: any) {
    const i = this.selectedIndex();
    if (i === null) return;
    const el = { ...this.elements()[i], [field]: value } as LabelElement;
    const arr = [...this.elements()];
    arr[i] = el;
    this.elements.set(arr);
    this.pushSnapshot();
    this.triggerAutoSave();
    if (field === 'content' || field === 'width' || field === 'height' || field === 'variableField') {
      this.updateRenderCache();
    }
  }

  updateStyle(field: keyof LabelElement['style'], value: any) {
    const i = this.selectedIndex();
    if (i === null) return;
    const el = { ...this.elements()[i] };
    el.style = { ...el.style, [field]: value };
    const arr = [...this.elements()];
    arr[i] = el;
    this.elements.set(arr);
    this.pushSnapshot();
    this.triggerAutoSave();
    this.updateRenderCache();
  }

  updateVariable(value: string | null) {
    const i = this.selectedIndex();
    if (i === null) return;
    const el = { ...this.elements()[i], variableField: value } as LabelElement;
    const arr = [...this.elements()];
    arr[i] = el;
    this.elements.set(arr);
    this.pushSnapshot();
    this.triggerAutoSave();
    this.updateRenderCache();
  }

  deleteSelected() {
    const i = this.selectedIndex();
    if (i === null) return;
    const arr = this.elements().filter((_, idx) => idx !== i);
    this.elements.set(arr);
    this.selectedIndex.set(null);
    this.pushSnapshot();
    this.triggerAutoSave();
    this.updateRenderCache();
  }

  selectedType = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return '';
    return this.elements()[i].type;
  });
  selectedX = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return 0;
    return this.elements()[i].x;
  });
  selectedY = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return 0;
    return this.elements()[i].y;
  });
  selectedWidth = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return 0;
    return this.elements()[i].width;
  });
  selectedHeight = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return 0;
    return this.elements()[i].height;
  });
  selectedContent = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return '';
    return this.elements()[i].content;
  });
  selectedVariable = computed(() => {
    const i = this.selectedIndex();
    if (i === null) return null;
    return this.elements()[i].variableField || null;
  });
  selectedStyle(field: keyof LabelElement['style']) {
    const i = this.selectedIndex();
    if (i === null) return null;
    const style = this.elements()[i].style as any;
    return style[field] ?? null;
  }

  toggleGrid(val: boolean) { this.showGrid.set(val); }
  toggleSnap(val: boolean) { this.snapToGrid.set(val); }
  onZoom(val: number) { this.zoom.set(+val); }

  openInNewTab() {
    const id = this.template().id;
    window.open(`/cadena-suministro/inventario/disenador/edit/${id}`, '_blank');
  }

  navigatePreview() {
    this.router.navigate(['../preview'], { relativeTo: this.route });
  }

  manualSave() { this.persist(); }

  savedRecently = computed(() => Date.now() - this.lastSave() < 2000);

  triggerAutoSave() {
    clearTimeout(this._saveDebounce);
    this._saveDebounce = setTimeout(() => this.persist(), 500) as any;
  }

  _saveDebounce: any;
  history: LabelElement[][] = [];
  redoStack: LabelElement[][] = [];
  pushSnapshot() {
    this.history.push(JSON.parse(JSON.stringify(this.elements())));
    if (this.history.length > 50) this.history.shift();
    this.redoStack = [];
  }
  undo() {
    if (this.history.length < 2) return;
    const current = this.history.pop()!;
    this.redoStack.push(current);
    const prev = this.history[this.history.length - 1];
    this.elements.set(JSON.parse(JSON.stringify(prev)));
    this.triggerAutoSave();
  }
  redo() {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop()!;
    this.elements.set(JSON.parse(JSON.stringify(next)));
    this.history.push(next);
    this.triggerAutoSave();
  }

  persist() {
    const t = { ...this.template(), elements: this.elements(), updatedAt: new Date() };
    this.repo.update(t.id, { elements: t.elements, updatedAt: t.updatedAt, width: t.width, height: t.height, name: t.name }).subscribe(() => {
      this.lastSave.set(Date.now());
      this.saveStatus.set('Guardado');
    });
  }

  resolveContent(el: LabelElement): string {
    if (el.variableField) {
      const sp = this.sampleProduct();
      switch (el.variableField) {
        case 'product.name': return sp.name;
        case 'product.sku': return sp.sku;
        case 'product.description': return sp.description;
        case 'product.sale_price': return String(sp.sale_price);
      }
    }
    return el.content || '';
  }

  async updateRenderCache() {
    const qr: Record<string, string> = { ...this.qrCache() };
    const bc: Record<string, string> = { ...this.barcodeCache() };
    for (const el of this.elements()) {
      const text = this.resolveContent(el);
      if (el.type === 'qr') {
        try {
          qr[el.id] = await QRCode.toDataURL(text || '');
        } catch { qr[el.id] = ''; }
      } else if (el.type === 'barcode') {
        bc[el.id] = this.generateCode39DataURL(text || '', this.mmToPx(el.width), this.mmToPx(el.height));
      }
    }
    this.qrCache.set(qr);
    this.barcodeCache.set(bc);
  }

  generateCode39DataURL(text: string, widthPx: number, heightPx: number): string {
    const startStop = ' * ';
    const full = `*${text.toUpperCase()}*`;
    const map: Record<string, string> = {
      '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn',
      'A':'wnnnnwnnw','B':'nnwnnwnnw','C':'wnwnnwnnn','D':'nnnnwwnnw','E':'wnnnwwnnn','F':'nnwnwwnnn','G':'nnnnnwwnw','H':'wnnnnwwnn','I':'nnwnnwwnn','J':'nnnnwwwnn',
      'K':'wnnnnnnww','L':'nnwnnnnww','M':'wnwnnnnwn','N':'nnnnwnnww','O':'wnnnwnnwn','P':'nnwnwnnwn','Q':'nnnnnnwww','R':'wnnnnnwwn','S':'nnwnnnwwn','T':'nnnnwnwwn',
      'U':'wwnnnnnnw','V':'nwwnnnnnw','W':'wwwnnnnnn','X':'nwnnwnnnw','Y':'wwnnwnnnn','Z':'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','*':'nwnnwnwnn','$':'nwnwnwnnn','/':'nwnwnnnwn','+':'nwnnnwnwn','%':'nnnwnwnwn'
    };
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(widthPx, 1);
    canvas.height = Math.max(heightPx, 1);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#000';
    let x = 0;
    const narrow = Math.max(1, Math.floor(widthPx / (full.length * 10)));
    const wide = narrow * 3;
    for (let i=0; i<full.length; i++) {
      const pattern = map[full[i]] || map[' '];
      for (let j=0; j<pattern.length; j++) {
        const isBar = j % 2 === 0;
        const w = pattern[j] === 'n' ? narrow : wide;
        if (isBar) ctx.fillRect(x, 0, w, heightPx);
        x += w;
      }
      // inter-character narrow space
      x += narrow;
      if (x >= widthPx) break;
    }
    try { return canvas.toDataURL('image/png'); } catch { return ''; }
  }
}
