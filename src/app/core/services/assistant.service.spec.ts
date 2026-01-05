import { TestBed } from '@angular/core/testing';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
    let service: AssistantService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AssistantService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set stock alert', () => {
        service.triggerStockAlert('Test Item');
        expect(service.stockAlert()).toEqual({ item: 'Test Item' });
    });

    it('should clear alert', () => {
        service.triggerStockAlert('Test Item');
        service.clearAlert();
        expect(service.stockAlert()).toBeNull();
    });
});
