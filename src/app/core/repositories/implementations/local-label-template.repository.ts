import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { LabelTemplate } from '../../models/label-template.model';
import { LabelTemplateRepository } from '../label-template.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root'
})
export class LocalLabelTemplateRepository extends LabelTemplateRepository {
    private readonly STORAGE_KEY = 'scm_label_templates';

    constructor() {
        super();
        this.initializeDefaults();
    }

    private getTemplates(): LabelTemplate[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    private saveTemplates(templates: LabelTemplate[]): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    }

    private initializeDefaults() {
        const templates = this.getTemplates();
        if (templates.length === 0) {
            const defaultTemplate: LabelTemplate = {
                id: uuidv4(),
                name: 'Etiqueta Estándar (50x30mm)',
                width: 50,
                height: 30,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDefault: true,
                elements: [
                    {
                        id: uuidv4(),
                        type: 'text',
                        content: 'Producto Demo',
                        x: 2,
                        y: 2,
                        width: 46,
                        height: 5,
                        style: {
                            fontSize: 10,
                            fontWeight: 'bold',
                            textAlign: 'center'
                        },
                        variableField: 'product.name'
                    },
                    {
                        id: uuidv4(),
                        type: 'qr',
                        content: '123456',
                        x: 15,
                        y: 8,
                        width: 20,
                        height: 20,
                        style: {},
                        variableField: 'product.sku'
                    }
                ]
            };
            this.saveTemplates([defaultTemplate]);
        }
    }

    getAll(): Observable<LabelTemplate[]> {
        return of(this.getTemplates());
    }

    getById(id: string): Observable<LabelTemplate | null> {
        const template = this.getTemplates().find(t => t.id === id);
        return of(template || null);
    }

    create(template: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Observable<LabelTemplate> {
        const templates = this.getTemplates();
        const newTemplate: LabelTemplate = {
            ...template,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        templates.push(newTemplate);
        this.saveTemplates(templates);
        return of(newTemplate);
    }

    update(id: string, template: Partial<LabelTemplate>): Observable<LabelTemplate> {
        const templates = this.getTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index === -1) return throwError(() => new Error('Template not found'));

        const updatedTemplate = {
            ...templates[index],
            ...template,
            updatedAt: new Date()
        };
        templates[index] = updatedTemplate;
        this.saveTemplates(templates);
        return of(updatedTemplate);
    }

    delete(id: string): Observable<void> {
        const templates = this.getTemplates();
        const filtered = templates.filter(t => t.id !== id);
        this.saveTemplates(filtered);
        return of(void 0);
    }
}
