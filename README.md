# ERP SaaS Pro - Edición 2026

Sistema Integral de Administración Empresarial (ERP) de clase mundial, diseñado para la escalabilidad, el rendimiento y una experiencia de usuario premium.

## 🚀 Estado del Sistema: PRODUCTO TERMINADO (Senior Grade)

Este repositorio contiene la suite completa de módulos operativos, financieros y estratégicos, totalmente integrados mediante una arquitectura basada en repositorios y micro-servicios de frontend.

### 📦 Módulos Principales (100% Funcionales)
1.  **Ventas & CRM**: Gestión de pedidos mayoristas, retail (POS) y seguimiento de oportunidades.
2.  **Finanzas & Contabilidad**: Facturación CFDI, control de gastos, libro diario y cuentas por cobrar/pagar.
3.  **Cadena de Suministro**: Inventario multi-almacén, logística de movimientos y compras.
4.  **Manufactura (Producción)**: Tablero Kanban de órdenes de trabajo, explosión de materiales (BOM) y control de procesos.
5.  **Recursos Humanos**: Gestión de plantilla de personal, esquemas de nómina y contratos.
6.  **Marketing & Web**: Campañas de crecimiento, ROI publicitario y gestión de contenido (Blog).

### 🛠️ Tecnología Core
*   **Framework**: Angular 18+ (Signals, Standalone Components).
*   **Backend**: Supabase (PostgreSQL, Auth, RLS).
*   **Diseño**: CSS Moderno con Glassmorphism y micro-animaciones dinámicas.
*   **Asistencia**: AI-Driven Assistant Sphere para onboarding contextual.

![Estado de compilación](https://img.shields.io/badge/build-passing-brightgreen)
![Cobertura](https://img.shields.io/badge/coverage-80%25-green)
![Angular](https://img.shields.io/badge/Angular-18%2B-dd0031)
![Supabase](https://img.shields.io/badge/Supabase-v2-3ecf8e)
![Vitest](https://img.shields.io/badge/Vitest-v2-729b1b)

## 🚀 Características

- **Arquitectura Multi-Inquilino**: Soporte para múltiples organizaciones con datos aislados.
- **Autenticación y Autorización**: Inicio de sesión seguro con Supabase Auth y Control de Acceso Basado en Roles (RBAC) utilizando Guards.
- **Aprovisionamiento de Super Administrador**: Panel dedicado para crear inquilinos y gestionar licencias de módulos.
- **Diseño Modular**:
  - **Inventario**: Gestión de productos, seguimiento de stock, importaciones CSV y validación estricta de auditoría en movimientos.
  - **Ventas**: CRM, Cotizaciones, Pedidos, POS (Retail y Restaurante) y Suscripciones.
  - **Cadena de Suministro**: Manufactura, PLM, Compras (Complete con gestión de órdenes, proveedores y variantes), Control de Calidad y Logística (Transferencias).
  - **Ventas**: CRM, Cotizaciones, Pedidos, POS (Punto de Venta) y Suscripciones.
  - **Finanzas**: Contabilidad, Facturación, Gastos y Tesorería.
  - **RRHH**: Gestión de empleados, Reclutamiento, Tiempo Libre y Nómina.
  - **Web**: Constructor de Sitios Web, Comercio Electrónico, Blog y Foros.
  - **Marketplace**: Instalación dinámica de módulos y gestión a través de una interfaz modal.
- **UI/UX Moderna**: Diseño responsivo construido con Tailwind CSS, modo oscuro y componentes personalizados.
- **Datos en Tiempo Real**: Aprovechando las capacidades en tiempo real de Supabase.

## 🛠️ Stack Tecnológico

- **Frontend**: Angular 18+, TypeScript, RxJS
- **Estilos**: Tailwind CSS, SCSS
- **Backend / Base de Datos**: Supabase (PostgreSQL, Auth, Storage)
- **Pruebas**: Vitest (Pruebas Unitarias)
- **Herramienta de Construcción**: Angular CLI

## 📋 Prerrequisitos

Asegúrate de tener instalado lo siguiente:

- **Node.js** (v18 o superior)
- **npm** (v10 o superior)
- **Angular CLI** (`npm install -g @angular/cli`)

## ⚙️ Instalación

1. **Clonar el repositorio**:

    ```bash
    git clone https://github.com/your-username/erp-saas.git
    cd erp-saas
    ```

2. **Instalar dependencias**:

    ```bash
    npm install
    ```

3. **Configuración del Entorno**:
    Crea un archivo `src/environments/environment.ts` con tus credenciales de Supabase:

    ```typescript
    export const environment = {
      production: false,
      supabaseUrl: 'TU_URL_SUPABASE',
      supabaseKey: 'TU_CLAVE_ANONIMA_SUPABASE'
    };
    ```

## ▶️ Ejecutando la Aplicación

Para iniciar el servidor de desarrollo local:

```bash
ng serve
```

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente.

## 🧪 Ejecutando Pruebas

Este proyecto utiliza **Vitest** para pruebas unitarias rápidas y modernas.

### Ejecutar Pruebas Unitarias

Para ejecutar las pruebas unitarias:

```bash
ng test
```

### Ejecutar con Cobertura

Para generar un reporte de cobertura de código:

```bash
ng test --code-coverage
```

El reporte de cobertura se generará en el directorio `coverage/`.

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── core/           # Servicios singleton, guards, modelos e interceptores
│   │   ├── guards/     # Guards de Autenticación y Roles
│   │   ├── models/     # Interfaces y tipos TypeScript
│   │   ├── services/   # Servicios globales (Sesión, Supabase, etc.)
│   │   └── repositories/ # Capa de acceso a datos (Patrón Repositorio)
│   ├── features/       # Módulos de características (Inventario, Ventas, Auth, Admin, etc.)
│   ├── shared/         # Componentes reutilizables, pipes y directivas
│   └── app.routes.ts   # Enrutamiento principal de la aplicación
├── assets/             # Activos estáticos (imágenes, fuentes)
├── environments/       # Configuración de entorno
└── styles.scss         # Estilos globales e importaciones de Tailwind
```

## 🤝 Contribuyendo

1. Haz un Fork del repositorio.
2. Crea tu rama de características (`git checkout -b feature/CaracteristicaIncreible`).
3. Haz commit de tus cambios (`git commit -m 'Agrega alguna CaracteristicaIncreible'`).
4. Haz push a la rama (`git push origin feature/CaracteristicaIncreible`).
5. Abre un Pull Request.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.

## 🔄 Actualizaciones Recientes

### Diciembre 2025 - Control de Marketplace y Módulos
- **Marketplace**: Implementación completa del control de instalación y desinstalación de módulos desde el Launcher.
- **Rutas Dinámicas**: Sincronización automática de rutas del Launcher basadas en la tabla de módulos de Supabase.
- **RRHH**: Integración del módulo de Recursos Humanos con gestión de empleados y rutas específicas (`/rrhh`).
- **Manufactura**: Migración del repositorio de Manufactura de Mock a Supabase, con soporte para órdenes de producción, procesos y BOMs.
- **Base de Datos**: Creación de tablas faltantes para RRHH y Manufactura mediante scripts de migración.
- **Inventario**: Nueva funcionalidad de **Impresión de Etiquetas** con códigos QR y generación dinámica de PDF/Vista de impresión.
- **Marketplace**: Rediseño premium con soporte para instalación y desinstalación dinámica de módulos según el contexto de la empresa.

