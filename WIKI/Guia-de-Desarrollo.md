# Guía de Desarrollo

Para mantener la coherencia y calidad del sistema, todos los desarrolladores deben seguir estos estándares.

## 🎨 Sistema de Diseño (Premium Dark)

El sistema utiliza un tema único oscuro. **No usar clases de modo claro o prefijos `dark:`**.

- **Fondo Principal**: `#101622` (Launcher) / `#111022` (Detalle).
- **Tarjetas/Contenedores**: `#181825` o `#1c212c`.
- **Bordes**: `#282839` o `#2d3648`.
- **Color Primario**: Definido dinámicamente vía `ThemeService`, pero generalmente `#6764f2` (Indigo).

## 🚀 Mejores Prácticas

### 1. Standalone Components

Todos los nuevos componentes deben ser `standalone: true`.

### 2. Signals

Priorizar el uso de Angular Signals (`signal`, `computed`, `effect`) para el manejo del estado reactivo en lugar de observables complejos cuando sea posible.

### 3. Material Symbols

Utilizar siempre Material Symbols para los iconos principales de la interfaz.

```html
<span class="material-symbols-outlined">inventory_2</span>
```

### 4. Navegación

Utilizar `routerLink` para navegación simple y el servicio `Router` para lógica compleja, siempre respetando la jerarquía de rutas definida en `app.routes.ts`.

## 🛠 Comandos Útiles

- `npm start`: Inicia el servidor de desarrollo.
- `npm run build`: Genera el bundle de producción para validación.
- `ng generate component path/to/comp`: Crea un nuevo componente.
