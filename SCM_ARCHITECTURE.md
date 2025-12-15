# Guía de Arquitectura: Variantes, Almacenes y Cálculo de Stock

Este documento define la arquitectura de datos del módulo de Inventario (SCM) para asegurar la coherencia en el desarrollo y en el cálculo de existencias (`quantity_on_hand`).

## 1. La Unidad Fundamental de Stock: La Variante (`variant_id`)

En el sistema **Agave Boots (Calzado)**, la unidad de inventario rastreable es la **Variante**, no el Producto Base.

* **Producto Base (`scm_products.id`)**: Define el modelo genérico (ej. "Bota Bulldog Pitón"). Contiene la configuración de tallas (`size_config`).
* **Unidad de Stock (`scm_product_variants.id`)**: Define la Talla/SKU específico (ej. "Bota Bulldog Pitón - Talla 27.5 MX"). **Todos los movimientos y existencias deben usar este ID.**

## 2. Cálculo de Existencias (`scm_stock_levels`)

La tabla `scm_stock_levels` es la tabla de intersección que almacena el nivel de stock en tiempo real. Su clave es compuesta por la **Ubicación** y la **Talla**.

$$ \text{Existencias Actuales} = \sum (\text{Movimientos de Entrada}) - \sum (\text{Movimientos de Salida}) $$

### Componentes de la Fila de Stock

| Columna Clave | Rol en el Inventario |
| :--- | :--- |
| `variant_id` | Identifica la Talla específica (ej. 25.5 MX). |
| `warehouse_id` | Identifica la ubicación física (ej. Tienda 1). |
| `quantity_on_hand` | El valor actual de existencias para esa combinación. |
| `tenant_id` / `company_id` | **Filtros de seguridad.** |

### Flujo de Actualización (Transaccional)

El stock actual **NO** se calcula sumando todos los movimientos cada vez. Se sigue el patrón transaccional de SCM:

1. Se crea un registro en `scm_stock_movements` (Histórico).
2. Inmediatamente después, el repositorio ejecuta una operación **UPSERT** en `scm_stock_levels` que:
    * Busca el registro por (`variant_id`, `warehouse_id`, `tenant_id`).
    * Si existe: Actualiza (`quantity_on_hand = old_quantity ± change`).
    * Si no existe: Inserta el registro con la cantidad inicial.

## 3. Seguridad y Contexto

Todo acceso a las tablas SCM (`scm_products`, `scm_product_variants`, `scm_stock_levels`, `scm_stock_movements`) debe aplicar el **doble filtro de seguridad** obtenido del `SessionService`:

1. **Filtro 1: `tenant_id`**
2. **Filtro 2: `company_id`**

> **CRITICO**: Cualquier consulta que omita este doble filtro debe ser considerada un error de seguridad.

---

## 4. Auditoría y Trazabilidad

Para garantizar la integridad y responsabilidad de los datos, todos los movimientos de inventario deben estar vinculados a un usuario real.

* **Validación de Usuario**: El campo `created_by` en `scm_stock_movements` es obligatorio y debe contener un UUID válido de `auth.users`.
* **Prohibición de Fallbacks**: No se permite el uso de IDs de sistema genéricos o nulos. Si no hay sesión de usuario activa, la operación de movimiento de stock debe ser rechazada.

## 🎯 Instrucción para el Desarrollo

A partir de este momento, todo desarrollo o modificación en los módulos de SCM debe adherirse estrictamente a esta arquitectura de datos:

1. **Stock = Variante + Almacén.**
2. Los movimientos de stock (`scm_stock_movements`) son la fuente de verdad histórica y requieren `created_by` válido.
3. `scm_stock_levels` es el balance en tiempo real, mantenido por operaciones transaccionales (UPSERT).
4. **Doble Filtro de Seguridad obligatorio en cada consulta.**
