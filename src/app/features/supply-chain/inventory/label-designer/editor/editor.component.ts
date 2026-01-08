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
  templateUrl: './editor.component.html'
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
