import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SessionService } from '@core/services/session.service';
import { ProductRepository } from '@core/repositories/product.repository';
import { NotificationService } from '@core/services/notification.service';
import { ScmProduct } from '@core/models/erp.types';
import { PurchaseOrderService } from '@core/services/purchase-order.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { ThemeService } from '@core/services/theme.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * @component InventoryComponent
 * @description Componente principal para el tablero de control de inventarios.
 * Proporciona funcionalidades de visualización, búsqueda, filtrado, exportación a PDF
 * y gestión de existencias por almacén.
 */

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  templateUrl: './inventory.component.html'
})
export class InventoryComponent implements OnInit {
  // Config
  private session = inject(SessionService);
  private productRepo = inject(ProductRepository);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private poService = inject(PurchaseOrderService);
  public themeService = inject(ThemeService);

  // State
  products = signal<ScmProduct[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  isLoading = signal(true);

  // Stock Modal
  showStockDetails = signal(false);
  selectedStockProduct = signal<any>(null);
  stockBreakdown = signal<{ name: string, qty: number }[]>([]); // Warehouse breakdown

  // Filters
  searchControl = new FormBuilder().control('');
  statusFilterControl = new FormBuilder().control('all');

  // Math helper for template
  Math = Math;

  totalProducts = computed(() => this.totalCount());
  activeProducts = computed(() => this.totalCount()); // Placeholder approximation
  totalValue = computed(() => this.products().reduce((acc, p) => acc + (p.sale_price || 0), 0) * (this.totalCount() / this.pageSize() || 1)); // Estimate

  constructor() {
    // Suscribirse a cambios en los filtros para recargar los datos automáticamente
    this.searchControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });
  }

  /**
   * Inicializa el componente cargando los datos iniciales.
   */
  ngOnInit() {
    this.loadData();
  }

  /**
   * Carga los productos de inventario de forma paginada y filtrada.
   * @async
   */
  async loadData() {
    this.isLoading.set(true);
    const tenantId = this.session.currentTenantId();

    if (!tenantId) {
      this.notification.error('No se ha seleccionado una organización.');
      this.router.navigate(['/companies']);
      return;
    }

    try {
      const filters = {
        search: this.searchControl.value,
        status: this.statusFilterControl.value
      };

      const result = await this.productRepo.getPaginated(
        tenantId,
        this.currentPage(),
        this.pageSize(),
        filters
      );

      this.products.set(result.data);
      this.totalCount.set(result.totalCount);
    } catch (e: any) {
      this.notification.error('Error al cargar el inventario. Por favor, intente de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Establece una página específica en el paginador.
   * @param page Número de página a establecer.
   */
  setPage(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  /**
   * Navega a la siguiente página de resultados.
   */
  nextPage() {
    if (this.currentPage() * this.pageSize() < this.totalCount()) {
      this.currentPage.update(p => p + 1);
      this.loadData();
    }
  }

  /**
   * Navega a la página anterior de resultados.
   */
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
    }
  }

  /**
   * Navega al formulario de edición de un producto.
   * @param id ID único del producto.
   */
  editProduct(id: string) {
    this.router.navigate(['/inventory/edit', id]);
  }

  /**
   * Elimina un producto tras confirmar la acción.
   * @param id ID único del producto a eliminar.
   * @async
   */
  async deleteProduct(id: string) {
    if (!confirm('¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.')) return;

    try {
      await this.productRepo.delete(id);
      this.notification.success('Producto eliminado correctamente.');
      this.loadData();
    } catch (e) {
      this.notification.error('Error al intentar eliminar el producto.');
    }
  }

  // --- LÓGICA DE EXISTENCIAS (STOCK) ---

  /**
   * Calcula la suma total de existencias disponibles para un producto sumando todas sus variantes.
   * @param product Objeto del producto con sus variantes y niveles de stock.
   * @returns Cantidad total disponible.
   */
  calculateTotalStock(product: any): number {
    if (!product?.variants) return 0;
    return product.variants.reduce((acc: number, v: any) => {
      const vStock = v.stock_levels?.reduce((sAcc: number, s: any) => sAcc + (s.quantity_on_hand || 0), 0) || 0;
      return acc + vStock;
    }, 0);
  }

  /**
   * Abre el modal de detalle de existencias desglosando la cantidad por almacén.
   * @param product Producto seleccionado para ver el detalle.
   */
  openStockDetail(product: any) {
    this.selectedStockProduct.set(product);
    const warehouseMap = new Map<string, number>();

    if (product?.variants) {
      product.variants.forEach((v: any) => {
        v.stock_levels?.forEach((s: any) => {
          const warehouseName = s.warehouse?.name || 'Sin Asignar';
          const qty = s.quantity_on_hand || 0;
          warehouseMap.set(warehouseName, (warehouseMap.get(warehouseName) || 0) + qty);
        });
      });
    }

    const breakdown = Array.from(warehouseMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .filter(x => x.qty > 0)
      .sort((a, b) => b.qty - a.qty);

    this.stockBreakdown.set(breakdown);
    this.showStockDetails.set(true);
  }

  /**
   * Cierra el modal de detalle de existencias.
   */
  closeStockDetail() {
    this.showStockDetails.set(false);
    this.selectedStockProduct.set(null);
  }

  /**
   * Redirige al formulario de creación de Orden de Compra con los datos del producto pre-cargados.
   * @param product Producto para el cual se desea generar la orden de compra.
   */
  createPurchaseOrder(product: ScmProduct) {
    if (!product.reorder_quantity) {
      this.notification.warning('Este producto no tiene una cantidad de reorden configurada.');
    }

    this.router.navigate(['/cadena-suministro/compras/new'], {
      queryParams: {
        product_id: product.id,
        quantity: product.reorder_quantity || 1,
        unit_price: product.cost_price || 0
      }
    });
  }

  /**
   * Genera un archivo PDF con el contenido actual de la tabla de inventario.
   * Utiliza html2canvas y jsPDF con sanetización de estilos CSS para evitar errores de renderizado.
   * @async
   */
  async exportToPdf() {
    const data = document.getElementById('inventory-table-container');
    if (!data) return;

    this.notification.info('Preparando documento PDF...');

    // Ocultar elementos que no queremos en el PDF
    const actionsHeader = data.querySelector('thead th:last-child') as HTMLElement;
    const actionsCells = data.querySelectorAll('tbody td:last-child') as NodeListOf<HTMLElement>;
    const originalHeaderDisplay = actionsHeader?.style.display;
    const originalCellsDisplay: string[] = [];
    actionsCells.forEach(cell => originalCellsDisplay.push(cell.style.display));

    if (actionsHeader) actionsHeader.style.display = 'none';
    actionsCells.forEach(cell => cell.style.display = 'none');

    try {
      const canvas = await html2canvas(data, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 1. ELIMINAR TODAS LAS HOJAS DE ESTILO EXTERNAS (LINK)
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          links.forEach(l => l.remove());

          // 2. SANEAR ETIQUETAS <style> EXISTENTES (Catch oklch, oklab, lch, etc)
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach(style => {
            // Reemplazo agresivo de cualquier función de color moderna por un color hex seguro
            // Cubre oklch, oklab, lch, hwb y color-mix (comunes en Tailwind 4)
            style.innerHTML = style.innerHTML.replace(/(?:oklch|oklab|lch|hwb|color-mix)\s*\([^)]+\)/gi, '#4f46e5');
          });

          // 3. INYECTAR ESTILOS BASE ESENCIALES
          const styleOverride = clonedDoc.createElement('style');
          styleOverride.innerHTML = `
            body { font - family: -apple - system, BlinkMacSystemFont, "Segoe UI", Roboto, sans - serif; background: white; }
#inventory - table - container {
  background: white!important;
  color: black!important;
  width: 100 % !important;
  max - width: none!important;
  padding: 0!important;
}
            table { width: 100 %; border - collapse: collapse; margin - top: 10px; font - size: 11px; }
th, td { border: 1px solid #e2e8f0; padding: 10px; text - align: left; }
            th { background - color: #f8fafc; color: #1e293b; font - weight: bold; text - transform: uppercase; }
            .bg - indigo - 600 { background - color: #4f46e5!important; color: white!important; }
            .text - indigo - 600, .text - indigo - 500 { color: #4f46e5!important; }
            .bg - indigo - 50 { background - color: #eef2ff!important; }
            .bg - red - 50 { background - color: #fef2f2!important; }
            .bg - amber - 50 { background - color: #fffbeb!important; }
            .font - bold { font - weight: 700; }
            .font - medium { font - weight: 500; }
            .whitespace - nowrap { white - space: nowrap; }
            .text - xs { font - size: 9px; }
            .text - gray - 500 { color: #64748b; }
            .text - gray - 900 { color: #1e293b; }
`;
          clonedDoc.head.appendChild(styleOverride);

          // 4. LIMPIEZA ADICIONAL DE ESTILOS EN LÍNEA
          const all = clonedDoc.querySelectorAll('*');
          all.forEach(el => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.hasAttribute('style')) {
              const s = htmlEl.getAttribute('style') || '';
              // Reemplazo preventivo en atributos style
              htmlEl.setAttribute('style', s.replace(/(?:oklch|oklab|lch|hwb|color-mix)\s*\([^)]+\)/gi, '#4f46e5'));
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = (pdf as any).internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Header Indigo
      pdf.setFillColor(63, 81, 181);
      pdf.rect(0, 0, 210, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.text('REPORTE DE INVENTARIO', 15, 25);
      pdf.setFontSize(10);
      pdf.text(`Fecha: ${new Date().toLocaleString()} `, 15, 33);

      pdf.addImage(imgData, 'PNG', 0, 45, pdfWidth, pdfHeight);

      pdf.save(`Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
      this.notification.success('PDF generado con éxito.');

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.notification.error('Error al generar el PDF.');
    } finally {
      if (actionsHeader) actionsHeader.style.display = originalHeaderDisplay;
      actionsCells.forEach((cell, index) => cell.style.display = originalCellsDisplay[index]);
    }
  }

  /**
   * Redirige al formulario de registro de movimientos de stock con el producto pre-seleccionado.
   * @param product Producto seleccionado.
   */
  registerStockMovement(product: ScmProduct) {
    this.router.navigate(['/inventory/movements/new'], {
      queryParams: {
        product_id: product.id
      }
    });
  }

  cycleThemeColor(): void {
    this.themeService.cycleColorTheme();
  }
}
