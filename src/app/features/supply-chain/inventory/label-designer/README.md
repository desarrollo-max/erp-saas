# Módulo de Diseño de Etiquetas

Este módulo permite la creación, gestión y previsualización de plantillas de etiquetas para el inventario.

## Estructura del Módulo

El módulo se encuentra integrado en la ruta `cadena-suministro/inventario/disenador` y consta de los siguientes componentes:

### 1. Inicio (`home`)
- **Ruta**: `/`
- **Descripción**: Dashboard principal del diseñador. Permite acceso rápido a crear nuevas plantillas, ver historial y vistas previas.
- **Componente**: `LabelDesignerHomeComponent`

### 2. Historial de Movimientos (`history`)
- **Ruta**: `/history`
- **Descripción**: Registro histórico de impresiones de etiquetas y movimientos de stock asociados.
- **Componente**: `LabelDesignerHistoryComponent`

### 3. Vista Previa (`preview`)
- **Ruta**: `/preview`
- **Descripción**: Herramienta de visualización WYSIWYG para verificar el diseño de las etiquetas antes de la impresión física.
- **Componente**: `LabelDesignerPreviewComponent`

## Configuración y Dependencias

- Este módulo utiliza componentes standalone de Angular.
- Requiere `RouterLink` para la navegación interna.
- Se integra con el sistema de estilos global (Tailwind CSS) y los íconos de Material Symbols.

## Navegación

El acceso a este módulo se realiza desde el panel principal de Inventario (`cadena-suministro/inventario`), a través del botón "Diseñador de Etiquetas".
