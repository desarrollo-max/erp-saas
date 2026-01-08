import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LocalLabelTemplateRepository } from '@core/repositories/implementations/local-label-template.repository';
import { LabelTemplate } from '@core/models/label-template.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-label-designer-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class LabelDesignerPreviewComponent implements OnInit {
  private repo = inject(LocalLabelTemplateRepository);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);

  templates = signal<LabelTemplate[]>([]);
  form = this.fb.group({
    modelId: [null as string | null, [Validators.required]],
    pointId: [null as string | null, [Validators.required]],
  });

  printPoints = signal<{ id: string; name: string; supportsAny?: boolean; minW?: number; maxW?: number; minH?: number; maxH?: number }[]>([
    { id: 'pdf', name: 'PDF Export', supportsAny: true },
    { id: 'zebra_small', name: 'Zebra ZT230 (60x40–100x60mm)', minW: 60, maxW: 100, minH: 40, maxH: 60 },
    { id: 'zebra_large', name: 'Zebra ZT610 (80x50–120x80mm)', minW: 80, maxW: 120, minH: 50, maxH: 80 },
  ]);

  selectedTemplate = computed(() => {
    const id = this.form.controls.modelId.value;
    return this.templates().find(t => t.id === id) || null;
  });

  availablePoints = computed(() => {
    const t = this.selectedTemplate();
    if (!t) return this.printPoints();
    return this.printPoints().filter(p => p.supportsAny || ((p.minW ?? 0) <= t.width && (p.maxW ?? Infinity) >= t.width && (p.minH ?? 0) <= t.height && (p.maxH ?? Infinity) >= t.height));
  });

  selectedPoint = computed(() => {
    const id = this.form.controls.pointId.value;
    return this.availablePoints().find(p => p.id === id) || null;
  });

  isCompatible = computed(() => {
    const t = this.selectedTemplate();
    const p = this.selectedPoint();
    if (!t || !p) return false;
    if (p.supportsAny) return true;
    return ((p.minW ?? 0) <= t.width && (p.maxW ?? Infinity) >= t.width && (p.minH ?? 0) <= t.height && (p.maxH ?? Infinity) >= t.height);
  });

  canPrint = computed(() => !!this.selectedTemplate() && !!this.selectedPoint() && this.isCompatible());

  ngOnInit() {
    this.repo.getAll().subscribe(list => this.templates.set(list));
    this.form.controls.modelId.valueChanges.subscribe(() => {
      this.form.controls.pointId.setValue(null);
    });
  }

  print() {
    if (!this.canPrint()) {
      this.notify.error('Seleccione modelo y punto válidos y compatibles');
      return;
    }
    window.print();
  }
}
