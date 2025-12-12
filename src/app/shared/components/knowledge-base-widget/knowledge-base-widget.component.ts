import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

interface WikiTopic {
    id: string;
    title: string;
    description: string;
    category: string;
}

@Component({
    selector: 'app-knowledge-base-widget',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule
    ],
    templateUrl: './knowledge-base-widget.component.html',
    styleUrls: ['./knowledge-base-widget.component.scss']
})
export class KnowledgeBaseWidgetComponent {
    @Input() context: any; // Ideally typed, but 'any' allows quick integration
    searchQuery = '';

    topics: WikiTopic[] = [
        { id: '1', title: 'Cómo crear una factura', description: 'Guía paso a paso para emitir una nueva factura de venta.', category: 'Ventas' },
        { id: '2', title: 'Gestión de usuarios', description: 'Aprende a añadir, editar y eliminar usuarios del sistema.', category: 'Administración' },
        { id: '3', title: 'Cierre de caja', description: 'Procedimiento para realizar el cierre de caja diario.', category: 'Finanzas' },
        { id: '4', title: 'Importar productos', description: 'Cómo cargar productos masivamente desde un archivo Excel.', category: 'Inventario' },
        { id: '5', title: 'Configuración de impuestos', description: 'Ajuste de tasas impositivas y retenciones.', category: 'Configuración' }
    ];

    get filteredTopics() {
        return this.topics.filter(topic =>
            topic.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            topic.description.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    }
}
