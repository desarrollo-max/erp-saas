# Módulo de Inventarios

El módulo de inventarios es el corazón de la cadena de suministro de SIAC ERP.

## 📋 Funcionalidades Principales

### 1. Gestión de Productos

- Visualización de stock total agregado por variantes.
- Control de precios de venta y costo.
- Categorización y estados de activación.

### 2. Movimientos de Stock

- **Movimiento Directo**: Registro rápido de entradas, salidas o ajustes. Accesible desde la cabecera o desde la fila de cada producto para pre-selección.
- **Historial**: Consulta detallada de todos los movimientos realizados en el sistema, con capacidad de exportación a PDF.

### 3. Importación

- Sistema de carga masiva vía CSV para facilitar la puesta en marcha inicial del inventario.

## 🔧 Integraciones Técnicas

- **StockRepository**: Gestiona el cálculo de existencias físicas.
- **ProductRepository**: Maneja la metadata del producto y sus variantes.
- **PDF Export**: Implementación basada en `html2pdf` o servicios similares para generar reportes profesionales.

## 🛣 Rutas de Interés

- `/inventory`: Dashboard principal.
- `/inventory/movements/history`: Historial de transacciones.
- `/inventory/movements/new`: Registro de nuevo movimiento.
- `/inventory/import`: Herramienta de carga masiva.
