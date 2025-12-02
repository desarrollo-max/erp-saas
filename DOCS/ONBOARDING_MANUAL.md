# Manual Técnico: ERP SaaS

Este documento sirve como guía definitiva para la arquitectura, patrones y estándares de desarrollo del proyecto ERP SaaS. Su objetivo es facilitar el onboarding de nuevos desarrolladores y mantener la consistencia técnica.

---

## 1. Visión del Proyecto

El objetivo es construir un **ERP Multi-tenant** moderno, rápido y escalable.
- **Multi-tenant**: Una sola instancia de la aplicación sirve a múltiples organizaciones (Tenants), con aislamiento estricto de datos.
- **Modular**: Funcionalidades divididas en módulos (Inventario, Ventas, Finanzas, etc.) que pueden activarse o desactivarse por empresa.
- **UX First**: Prioridad en la experiencia de usuario, velocidad de carga y diseño responsivo.

---

## 2. Stack Tecnológico

- **Frontend**: Angular 18+ (Standalone Components, Signals, Typed Forms).
- **Estilos**: Tailwind CSS (Utility-first).
- **Backend / BaaS**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Estado**: Signals (Nativo de Angular) para estado local y servicios globales para estado compartido.

---

## 3. Arquitectura & Patrones

### 3.1. Patrón Repositorio (Repository Pattern)

Utilizamos el patrón repositorio para desacoplar la lógica de negocio (Componentes/Servicios) de la fuente de datos (Supabase/API). Esto permite cambiar el backend o realizar pruebas unitarias (Mocking) con facilidad.

**Estructura de Archivos:**
- `src/app/core/repositories/`: Define las clases abstractas (contratos).
  - Ejemplo: `product.repository.ts`
- `src/app/core/repositories/implementations/`: Contiene la implementación concreta.
  - Ejemplo: `supabase-product.repository.ts`

**Inyección de Dependencias (`app.config.ts`):**
Angular se encarga de inyectar la implementación correcta cuando se solicita la clase abstracta.

```typescript
// app.config.ts
{ provide: ProductRepository, useClass: SupabaseProductRepository }
```

### 3.2. Gestión de Sesión (`SessionService`)

El `SessionService` es el corazón de la identidad del usuario en la aplicación.
- **Responsabilidades**:
  - Autenticación (Login/Logout).
  - **Auto-aprovisionamiento**: Si un usuario nuevo inicia sesión y no tiene Tenant, se crea uno automáticamente ("Mi Organización") y se le asigna.
  - Resolución del `Tenant` actual (Organización) consultando la tabla `users_tenants`.
  - Selección de la `Company` (Empresa/Sucursal) de trabajo.

### 3.3. Selector de Empresa (Launcher)

Después del login, el usuario es dirigido a `/companies`.
- **Funcionalidad**:
  - Lista las empresas disponibles para el Tenant del usuario.
  - Permite **Crear Nueva Empresa** si no existe ninguna o se requiere una adicional.
  - **Logout**: Botón siempre visible para cerrar sesión y cambiar de cuenta.
- **Flujo**: Login -> Auto-provision (si aplica) -> Selector de Empresa -> Dashboard.

---

## 4. Flujo de Seguridad & RLS (Row Level Security)

La seguridad y el aislamiento de datos son críticos. No confiamos solo en el frontend para filtrar datos.

1.  **Base de Datos (PostgreSQL)**:
    - Todas las tablas críticas tienen una columna `tenant_id`.
    - **RLS (Row Level Security)** está habilitado en todas las tablas.
    - Las políticas de RLS aseguran que un usuario solo pueda ver/editar filas donde `tenant_id` coincida con su registro en `users_tenants`.

2.  **Frontend**:
    - El `SessionService` obtiene el `tenant_id` al iniciar sesión.
    - Los repositorios incluyen automáticamente el `tenant_id` en las operaciones de escritura (Insert/Update) para cumplir con las restricciones de llave foránea.

---

## 5. Setup Local

### Prerrequisitos
- Node.js (v18 o superior)
- NPM

### Instalación
1.  Clonar el repositorio.
2.  Instalar dependencias:
    ```bash
    npm install
    ```

### Configuración de Entorno
Asegúrate de tener el archivo de entorno configurado con las credenciales de Supabase.
- `src/environments/environment.ts` (Desarrollo)

### Ejecución
```bash
ng serve
```
La aplicación estará disponible en `http://localhost:4200`.

---

## 6. Protocolo de Mantenimiento de Documentación

Este archivo es un documento vivo. El **Agente de Documentación (DocAgent)** es responsable de mantenerlo actualizado.

**Áreas Monitoreadas:**
- Cambios en contratos de repositorios (`src/app/core/repositories/*.ts`).
- Cambios en la inyección de dependencias (`src/app/app.config.ts`).
- Cambios en la lógica de sesión (`src/app/core/services/session.service.ts`).

**Comandos:**
- Ejecutar `/update_onboarding_manual` en el chat para forzar una sincronización de esta documentación con el código actual.

---

## 7. Definición de Hecho (Definition of Done) & Reglas de Contribución

Para garantizar la calidad y mantenibilidad del proyecto, se establece la siguiente regla de oro para cualquier nueva funcionalidad o cambio significativo:

> **"Siempre que se cree o modifique algo, se deberá actualizar el manual de onboarding y realizar tests y pruebas."**

**Checklist de Finalización de Tarea:**
1.  **Código Funcional**: La funcionalidad cumple con los requerimientos.
2.  **Pruebas**: Se han realizado pruebas manuales (y unitarias si aplica) para verificar el flujo completo, incluyendo casos de borde (ej. usuario nuevo, errores de red).
3.  **Documentación Actualizada**:
    - Si se añadieron nuevos módulos o servicios, actualizar la sección de Arquitectura.
    - Si cambió el flujo de usuario, actualizar la descripción del flujo.
    - Actualizar `ONBOARDING_MANUAL.md` con cualquier cambio relevante.
