# Plan de Implementación: Finalización del Frontend del Marketplace

## Objetivo
Completar la funcionalidad del Marketplace para permitir un control total (instalación/desinstalación) de los módulos desde el Launcher, asegurando una experiencia de usuario fluida y visualmente atractiva ("Premium").

## Tareas

### 1. Refactorización del Repositorio de Módulos (Completado)
- [x] Implementar `getAllAvailable` en `SupabaseModuleRepository`.
- [x] Implementar `getInstalledModules` en `SupabaseModuleRepository`.
- [x] Implementar `installModule` en `SupabaseModuleRepository`.
- [x] Implementar `uninstallModule` en `SupabaseModuleRepository`.

### 2. Mejora del `MarketplaceModalComponent`
- [ ] Cargar dinámicamente el estado de instalación de cada módulo.
- [ ] Implementar el "Toggle":
    - Botón "Instalar" para módulos no presentes.
    - Botón "Desinstalar" para módulos ya instalados.
- [ ] Mejorar la estética del modal (Glassmorphism, animaciones de hover).
- [ ] Mostrar indicadores claros de "Módulo Instalado".
- [ ] Manejar estados de carga individuales para cada acción de instalación/desinstalación.

### 3. Integración con el Launcher
- [ ] Asegurar que el Launcher se actualice automáticamente al instalar/desinstalar un módulo.
- [ ] Verificar que las rutas (`route_path`) de los módulos instalados funcionen correctamente.
- [ ] Limpiar redirecciones estáticas ("hotfixes") en el Launcher para usar los datos de la base de datos.

### 4. Verificación de Rutas y Accesos
- [ ] Revisar la tabla `modules` en la base de datos para asegurar que `route_path` coincida con `app.routes.ts`.
- [ ] Corregir discrepancias en las rutas de Inventario, POS, y Contabilidad.

### 5. Aseguramiento de Calidad (QA)
- [ ] Crear pruebas unitarias para `MarketplaceModalComponent`.
- [ ] Realizar pruebas de integración (Flujo: Contratar -> Ver en Launcher -> Abrir Módulo -> Desinstalar).
- [ ] Actualizar documentación técnica y README.md.

## Estado Actual
- El repositorio está listo.
- El componente `MarketplaceModalComponent` solo permite instalar y no muestra cuáles están instalados.
- El launcher ya carga módulos dinámicos pero tiene rutas "quemadas" (hardcoded).
