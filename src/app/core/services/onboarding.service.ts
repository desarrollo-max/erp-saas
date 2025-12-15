import { Injectable, signal, computed } from '@angular/core';

export interface TourStep {
    id: string;
    title: string;
    content: string;
    placement: 'top' | 'bottom' | 'left' | 'right';
}

@Injectable({
    providedIn: 'root'
})
export class OnboardingService {
    // Signals
    public currentStepIndex = signal<number>(-1);
    public isTourActive = signal<boolean>(false);

    // Definición de pasos del Tour
    // NOTA: Para que funcione, los elementos del DOM deben tener estos IDs.
    public tourSteps: TourStep[] = [
        {
            id: 'header-company-info',
            title: 'Contexto de Empresa',
            content: 'Aquí visualizas la empresa activa. Haz clic para cambiar de organización rápidamente.',
            placement: 'bottom'
        },
        {
            id: 'header-modules-menu',
            title: 'Navegación Modular',
            content: 'Accede a todos los módulos disponibles desde este menú desplegable.',
            placement: 'bottom'
        },
        {
            id: 'header-theme-toggle',
            title: 'Personalización',
            content: 'Alterna entre modo claro y oscuro para trabajar más cómodamente.',
            placement: 'bottom'
        },
        {
            id: 'launcher-grid',
            title: 'Tus Aplicaciones',
            content: 'Aquí encontrarás todos los módulos instalados listos para usar.',
            placement: 'top'
        },
        {
            id: 'sphere-assistant',
            title: 'Asistente IA',
            content: '¿Dudas? Tu asistente inteligente siempre está aquí para ayudarte.',
            placement: 'left'
        }
    ];

    public currentStep = computed(() => {
        const index = this.currentStepIndex();
        if (index >= 0 && index < this.tourSteps.length) {
            return this.tourSteps[index];
        }
        return null;
    });

    public isLastStep = computed(() => {
        return this.currentStepIndex() === this.tourSteps.length - 1;
    });

    constructor() { }

    startTour() {
        this.currentStepIndex.set(0);
        this.isTourActive.set(true);
    }

    nextStep() {
        const next = this.currentStepIndex() + 1;
        if (next < this.tourSteps.length) {
            this.currentStepIndex.set(next);
        } else {
            this.stopTour();
        }
    }

    stopTour() {
        this.isTourActive.set(false);
        this.currentStepIndex.set(-1);
    }

    getCurrentStep() {
        return this.currentStep();
    }
}
