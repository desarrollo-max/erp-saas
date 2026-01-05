# Arquitectura del Sistema

SIAC ERP utiliza un stack moderno y eficiente para garantizar escalabilidad y rendimiento.

## 🛠 Stack Tecnológico

- **Frontend**: [Angular](https://angular.io/) (v17+) con Standalone Components.
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) para un diseño responsivo y premium.
- **Base de Datos & Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime).
- **Iconografía**: [Material Symbols](https://fonts.google.com/icons) y [Heroicons](https://heroicons.com/).

## 📂 Estructura del Proyecto

### `src/app/core`

Contiene el núcleo del sistema:

- **Models**: Interfaces de TypeScript que definen la estructura de datos.
- **Repositories**: Capa de abstracción para el acceso a datos (Patrón Repository).
- **Services**: Lógica de negocio compartida (Sesión, Notificaciones, Temas).

### `src/app/features`

Módulos funcionales de la aplicación:

- **Launcher**: El escritorio principal del ERP.
- **Marketplace**: Sistema de instalación de nuevas aplicaciones.
- **Supply Chain**: Gestión de inventarios, almacenes y compras.
- **Modules/Definition**: Pantallas dinámicas de detalles de módulos.

### `src/app/shared`

Componentes y utilidades reutilizables en todo el proyecto.

## 🔌 Patrón Repository

Para el acceso a datos, se utiliza una interfaz abstracta en `core/repositories` y su implementación específica en `core/repositories/implementations/supabase-*`. Esto permite cambiar la fuente de datos si es necesario sin afectar la lógica del componente.
