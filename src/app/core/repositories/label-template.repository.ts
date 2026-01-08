import { Observable } from 'rxjs';
import { LabelTemplate } from '../models/label-template.model';

export abstract class LabelTemplateRepository {
    abstract getAll(): Observable<LabelTemplate[]>;
    abstract getById(id: string): Observable<LabelTemplate | null>;
    abstract create(template: Omit<LabelTemplate, 'id' | 'createdAt' | 'updatedAt'>): Observable<LabelTemplate>;
    abstract update(id: string, template: Partial<LabelTemplate>): Observable<LabelTemplate>;
    abstract delete(id: string): Observable<void>;
}
