# Manual Técnico - Módulo de Manufactura e Inventario

## 1. Visión General
Este documento detalla la implementación técnica de la integración entre los módulos de **Inventario (Supply Chain)**, **Compras** y **Manufactura (Producción)**. El objetivo principal es automatizar el flujo de materiales, desde la alerta de stock bajo hasta la producción de producto terminado.

---

## 2. Arquitectura de Integración

### 2.1 Flujo de Datos
1.  **Detección de Necesidad**:
    *   El sistema monitorea `reorder_point` en `ScmProduct`.
    *   Si `stock_actual < reorder_point`, se muestra alerta visual y opción de compra.

2.  **Reabastecimiento (Compras)**:
    *   **Acción**: Usuario genera Orden de Compra desde Inventario.
    *   **Servicio**: `PurchaseOrderService.createFromLowStock()`.
    *   **Resultado**: Registro en `scm_purchase_orders` (Estado: DRAFT).

3.  **Producción (Manufactura)**:
    *   **Inicio**: Se inicia una `MfgProductionOrder`.
    *   **Consumo**: Se busca la Receta (`MfgBillOfMaterials`) y se generan movimientos de salida (`OUT`) para cada materia prima.
    *   **Finalización**: Se genera movimiento de entrada (`IN` / `PRODUCTION_OUTPUT`) del producto terminado.

---

## 3. Componentes y Servicios Clave

### 3.1 `ProductionService`
Ubicación: `src/app/core/services/production.service.ts`

Encargado de orquestar la lógica de negocio de manufactura.
*   **`startProduction(orderId, tenantId)`**:
    *   Valida existencia de orden y BOM.
    *   Itera sobre items del BOM.
    *   Llama a `InventoryRepository.createMovement` para descontar stock.
    *   Actualiza estado de orden a `IN_PROGRESS`.
*   **`finishProduction(orderId, tenantId)`**:
    *   Ingresa el producto terminado al inventario.
    *   Actualiza estado de orden a `COMPLETED`.

### 3.2 `PurchaseOrderService`
Ubicación: `src/app/core/services/purchase-order.service.ts`

Maneja la creación rápida de órdenes de compra.
*   **`createFromLowStock(tenantId, product, qty)`**: Genera una orden automática basada en el `reorder_quantity` del producto y su último costo conocido.

### 3.3 `InventoryComponent`
Ubicación: `src/app/features/supply-chain/inventory/inventory.component.ts`

Interfaz principal para gestión de stock.
*   **Alertas**: Renderizado condicional de badges de "Stock Bajo".
*   **Acciones**: Botón de generación de compra rápida inyectado en la tabla.

### 3.4 `LauncherComponent`
Ubicación: `src/app/features/launcher/launcher.component.ts`

Punto de entrada y marketplace.
*   **Lógica de Módulos**: Filtra y muestra módulos instalados.
*   **"Próximamente"**: Módulos sin `route_path` se muestran deshabilitados visualmente.
*   **Redirección Inteligente**: Maneja casos especiales (ej. rutas legacy de inventario).

---

## 4. Modelos de Datos (Actualizaciones)

### `ScmProduct`
Se agregaron campos para automatización:
```typescript
interface ScmProduct {
  // ...
  reorder_point: number;       // Nivel mínimo de stock
  reorder_quantity: number;    // Cantidad sugerida de reposición
  last_purchase_cost?: number; // Costo histórico para POs
}
```

---

## 5. Repositorios (Capa de Datos)

### `ManufacturingRepository`
Se extendió el contrato para soportar búsquedas específicas requeridas por el servicio de producción:
*   `getOrderById(orderId)`
*   `getBomByProductId(productId)`

### `MockManufacturingRepository` & `MockInventoryRepository`
Implementaciones en memoria actualizadas para permitir pruebas de flujo completo sin backend real conectado.

---

## 6. Próximos Pasos Recomendados
1.  **Backend Real**: Implementar los endpoints nuevos en Supabase/PostgreSQL.
2.  **Validación de Stock**: Agregar chequeo de disponibilidad "antes" de iniciar producción (prevenir stock negativo si se desea).
3.  **Dashboard de Producción**: Visualizar progreso y alertas de material en el dashboard de manufactura.
