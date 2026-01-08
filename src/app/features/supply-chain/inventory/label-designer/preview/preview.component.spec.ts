import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LabelDesignerPreviewComponent } from './preview.component';
import { LocalLabelTemplateRepository } from '@core/repositories/implementations/local-label-template.repository';
import { NotificationService } from '@core/services/notification.service';
import { LabelTemplate } from '@core/models/label-template.model';

describe('LabelDesignerPreviewComponent', () => {
  let component: LabelDesignerPreviewComponent;
  let fixture: ComponentFixture<LabelDesignerPreviewComponent>;

  const templates: LabelTemplate[] = [
    { id: 't-small', name: 'Etiqueta 70x50', width: 70, height: 50, elements: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 't-large', name: 'Etiqueta 120x90', width: 120, height: 90, elements: [], createdAt: new Date(), updatedAt: new Date() },
  ];

  const repoMock = {
    getAll: () => of(templates),
    getById: () => of(null),
    create: () => of(templates[0]),
    update: () => of(templates[0]),
    delete: () => of(void 0),
  } as Partial<LocalLabelTemplateRepository>;

  const notifyMock = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
  } as Partial<NotificationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabelDesignerPreviewComponent],
      providers: [
        { provide: LocalLabelTemplateRepository, useValue: repoMock },
        { provide: NotificationService, useValue: notifyMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelDesignerPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse y cargar modelos', () => {
    expect(component).toBeTruthy();
    expect(component.templates().length).toBe(2);
  });

  it('debería deshabilitar impresión si faltan selecciones', () => {
    expect(component.canPrint()).toBeFalse();
    component.form.controls.modelId.setValue('t-small');
    expect(component.canPrint()).toBeFalse();
  });

  it('debería filtrar puntos disponibles según modelo', () => {
    component.form.controls.modelId.setValue('t-small');
    fixture.detectChanges();
    const pointsForSmall = component.availablePoints().map(p => p.id);
    expect(pointsForSmall).toContain('pdf');
    expect(pointsForSmall).toContain('zebra_small');
    expect(pointsForSmall).not.toContain('zebra_large');

    component.form.controls.modelId.setValue('t-large');
    fixture.detectChanges();
    const pointsForLarge = component.availablePoints().map(p => p.id);
    expect(pointsForLarge).toContain('pdf');
    expect(pointsForLarge).not.toContain('zebra_small');
    expect(pointsForLarge).not.toContain('zebra_large');
  });

  it('debería habilitar impresión únicamente cuando hay compatibilidad', () => {
    component.form.controls.modelId.setValue('t-small');
    component.form.controls.pointId.setValue('zebra_small');
    fixture.detectChanges();
    expect(component.isCompatible()).toBeTrue();
    expect(component.canPrint()).toBeTrue();
  });

  it('debería bloquear impresión si el punto no es compatible', () => {
    component.form.controls.modelId.setValue('t-small');
    component.form.controls.pointId.setValue('zebra_large');
    fixture.detectChanges();
    expect(component.selectedPoint()).toBeNull();
    expect(component.isCompatible()).toBeFalse();
    expect(component.canPrint()).toBeFalse();
  });

  it('debería invocar window.print cuando se puede imprimir', () => {
    const printSpy = spyOn(window, 'print');
    component.form.controls.modelId.setValue('t-small');
    component.form.controls.pointId.setValue('zebra_small');
    fixture.detectChanges();
    component.print();
    expect(printSpy).toHaveBeenCalled();
  });

  it('debería mostrar error cuando impresión no es válida', () => {
    component.form.controls.modelId.setValue('t-large');
    component.form.controls.pointId.setValue('zebra_large');
    fixture.detectChanges();
    component.print();
    expect((notifyMock.error as jasmine.Spy)).toHaveBeenCalled();
  });
});

