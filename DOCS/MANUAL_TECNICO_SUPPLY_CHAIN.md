# Manual Técnico - Cadena de Suministro (Supply Chain)

Este documento detalla la implementación técnica de los módulos operativos de la cadena de suministro en el sistema ERP-SaaS. Estos módulos gestionan el flujo físico de productos: entrada (Compras), salida (Punto de Venta) y movimiento interno (Transferencias).

---

## 1. Visión General

La arquitectura de estos módulos se basa en componentes "Stand-alone" de Angular que interactúan directamente con los repositorios (`InventoryRepository`, `ProductRepository`) y servicios centrales (`SessionService`, `SupabaseService`) para realizar operaciones atómicas sobre el inventario.

Todos los movimientos de stock se centralizan en la tabla `scm_stock_movements`, diferenciándose por el campo `movement_type`.

---

## 2. Módulos Implementados

### 2.1 Punto de Venta (POS)

**Ruta:** `/pos`
**Componente:** `PosComponent` (`src/app/features/pos/pos.component.ts`)

* **Descripción**: Interfaz simplificada para venta directa. Reduce el inventario en tiempo real.
* **Flujo de Datos**:
    1. Usuario selecciona **Almacén de Salida**.
    2. Busca productos y añade al **Carrito de Venta** (en memoria).
    3. Al confirmar ("Realizar Venta"):
        * Itera sobre el carrito.
        * Genera registros en `scm_stock_movements`.
        * **Tipo**: `OUT`.
        * **Referencia**: `pos_sale`.
        * **Cantidad**: Negativa (ej. -5).

### 2.2 Compras y Abastecimiento

**Ruta:** `/cadena-suministro/compras`
**Componente:** `PurchasingComponent` (`src/app/features/supply-chain/purchasing/purchasing.component.ts`)

* **Descripción**: Gestión de entradas de mercancía, ya sea por compra a proveedor o producción externa.
* **Flujo de Datos**:
    1. Usuario selecciona **Almacén de Entrada**.
    2. Añade productos a la **Orden de Compra**.
    3. Al confirmar:
        * Genera registros en `scm_stock_movements`.
        * **Tipo**: `IN`.
        * **Referencia**: `purchase_internal`.
        * **Cantidad**: Positiva (ej. +100).

### 2.3 Logística y Transferencias

**Ruta:** `/cadena-suministro/movimientos`
**Componente:** `StockTransferComponent` (`src/app/features/supply-chain/inventory/transfer/stock-transfer.component.ts`)

* **Descripción**: Movimiento de stock entre dos almacenes fisicos.
* **Flujo de Datos**:
    1. Selección de **Origen** y **Destino** (Validación: deben ser distintos).
    2. Creación del **Manifiesto de Carga**.
    3. Ejecución (Transacción lógica):
        * Para cada item, crea DOS movimientos vinculados por un `reference_number` común (ej. `TRF-171892...`).
        * **Movimiento 1 (Salida)**: Tipo `TRANSFER_OUT` en Almacén Origen (Cantidad negativa).
        * **Movimiento 1 (Salida)**: Tipo `TRANSFER_OUT` en Almacén Origen (Cantidad negativa).
        * **Movimiento 2 (Entrada)**: Tipo `TRANSFER_IN` en Almacén Destino (Cantidad positiva).

### 2.4 Etiquetado de Inventario

**Ruta:** `/cadena-suministro/inventario/etiquetas`
**Componente:** `LabelPrintingComponent` (`src/app/features/supply-chain/inventory/label-printing/label-printing.component.ts`)

* **Descripción**: Herramienta para generar e imprimir etiquetas de productos con código QR.
* **Funcionalidades**:
    1. **Selección de Producto y Variante**: Integración con selector dinámico dependiente.
    2. **Cola de Impresión**: Permite agregar múltiples productos con distintas cantidades antes de imprimir.
    3. **Generación QR**: Utiliza la librería `qrcode` para generar códigos escaneables (SKU).
    4. **Modo Impresión**: Estilos CSS `@media print` dedicados para formatear la salida en una grilla de etiquetas oculta en la vista normal.

---

## 3. Modelo de Datos: `scm_stock_movements`

Esta es la tabla central de auditoría de inventario.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único |
| `warehouse_id` | UUID | Almacén afectado |
| `product_id` | UUID | Producto movido |
| `quantity` | Numeric | Cantidad (Negativo = Salida, Positivo = Entrada) |
| `movement_type` | String | `IN`, `OUT`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT` |
| `reference_type` | String | Origen de la transacción (`pos_sale`, `purchase`, `transfer`) |
| `reference_number` | String | ID de agrupación (ej. ID de venta o transferencia) |
| `created_at` | Timestamp | Fecha real de registro |
| `movement_date` | Date | Fecha contable del movimiento |

---

## 4. Pruebas Unitarias

Se han implementado pruebas unitarias para garantizar la estabilidad de los componentes críticos.

* `pos.component.spec.ts`: Verifica la carga de datos, adición al carrito y llamadas al repositorio.
* `purchasing.component.spec.ts`: Valida lógica de orden de compra.
* `stock-transfer.component.spec.ts`: Asegura que no se permitan transferencias con mismo origen/destino y valida la creación de movimientos duales.
* `label-printing.component.spec.ts`: Verifica la carga de productos/variantes y la gestión de la cola de impresión.

Para ejecutar las pruebas:

```bash
ng test
```
