import { Component, inject, effect, ElementRef, Renderer2, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingService, TourStep } from '@core/services/onboarding.service';

@Component({
    selector: 'app-onboarding-tour',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="onboarding.isTourActive()" class="fixed inset-0 z-[9000] overflow-hidden pointer-events-auto">
      
      <!-- Dark Mask -->
      <div class="absolute inset-0 bg-black/70 transition-opacity duration-300"></div>

      <!-- Popover / Balloon -->
      <!-- We position this absolutely based on calculations -->
      <div *ngIf="position()" 
           class="absolute z-[10002] bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 p-6 rounded-xl shadow-2xl max-w-sm w-full transition-all duration-300 transform"
           [style.top.px]="position()?.top"
           [style.left.px]="position()?.left"
           [class.translate-y-2]="!position()"
           [class.opacity-0]="!position()">
           
        <div class="flex flex-col gap-3">
            <div class="flex justify-between items-start">
                <h3 class="font-bold text-lg text-indigo-600 dark:text-indigo-400">{{ onboarding.currentStep()?.title }}</h3>
                <span class="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {{ onboarding.currentStepIndex() + 1 }} / {{ onboarding.tourSteps.length }}
                </span>
            </div>
            
            <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {{ onboarding.currentStep()?.content }}
            </p>

            <div class="flex justify-end gap-2 mt-2">
                <button (click)="onboarding.stopTour()" 
                        class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    Saltar
                </button>
                <button (click)="onboarding.nextStep()" 
                        class="px-4 py-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors">
                    {{ onboarding.isLastStep() ? 'Finalizar' : 'Siguiente' }}
                </button>
            </div>
        </div>
        
        <!-- Arrow (Optional visual flair) -->
        <div class="absolute w-4 h-4 bg-white dark:bg-slate-800 transform rotate-45"
             [ngClass]="getArrowClass()">
        </div>

      </div>

    </div>
  `
})
export class OnboardingTourComponent implements OnDestroy {
    onboarding = inject(OnboardingService);
    private renderer = inject(Renderer2);

    // State for the highlighted element
    private activeElement: HTMLElement | null = null;
    private originalZIndex: string = '';
    private originalPosition: string = '';

    // Calculated position for the tooltip
    position = signal<{ top: number; left: number } | null>(null);

    constructor() {
        effect(() => {
            const step = this.onboarding.currentStep();
            const isActive = this.onboarding.isTourActive();

            // Clean up previous step
            this.clearHighlight();

            if (isActive && step) {
                // Wait a tick for DOM updates if necessary (e.g. route changes)
                setTimeout(() => {
                    this.highlightElement(step);
                }, 100);
            }
        });
    }

    private highlightElement(step: TourStep) {
        const el = document.getElementById(step.id);
        if (el) {
            this.activeElement = el;

            // Save original styles
            this.originalZIndex = el.style.zIndex;
            this.originalPosition = el.style.position;

            // Apply Highlight Styles
            // We lift the element above the mask (z-9000)
            this.renderer.setStyle(el, 'z-index', '10001');

            // Ensure position is at least relative so z-index works
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.position === 'static') {
                this.renderer.setStyle(el, 'position', 'relative');
            }

            // Calculate Tooltip Position
            this.calculatePosition(el, step.placement);

            // Optional: Scroll into view
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } else {
            console.warn(`Onboarding: Element with ID '${step.id}' not found.`);
            // Auto skip if not found? Or just show centered?
            // For now, let's just show centered if not found or top-left default.
            this.position.set({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 150 });
        }
    }

    private clearHighlight() {
        if (this.activeElement) {
            this.renderer.setStyle(this.activeElement, 'z-index', this.originalZIndex);
            this.renderer.setStyle(this.activeElement, 'position', this.originalPosition);
            this.activeElement = null;
        }
    }

    private calculatePosition(el: HTMLElement, placement: string) {
        const rect = el.getBoundingClientRect();
        const gap = 12; // Space between element and tooltip
        const tooltipWidth = 320; // Approx width
        const tooltipHeight = 150; // Approx height

        let top = 0;
        let left = 0;

        switch (placement) {
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'top':
                top = rect.top - tooltipHeight - gap;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                left = rect.right + gap;
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                left = rect.left - tooltipWidth - gap;
                break;
            default:
                top = rect.bottom + gap;
                left = rect.left;
        }

        // Boundary checks (Basic)
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 10;
        if (top < 10) top = 10;

        this.position.set({ top, left });
    }

    getArrowClass(): string {
        const placement = this.onboarding.currentStep()?.placement;
        switch (placement) {
            case 'bottom': return '-top-2 left-1/2 -translate-x-1/2 shadow-sm border-t border-l border-gray-100 dark:border-gray-700'; // pointing up
            case 'top': return '-bottom-2 left-1/2 -translate-x-1/2 shadow-sm border-b border-r border-gray-100 dark:border-gray-700'; // pointing down
            case 'right': return '-left-2 top-1/2 -translate-y-1/2 shadow-sm border-b border-l border-gray-100 dark:border-gray-700';
            case 'left': return '-right-2 top-1/2 -translate-y-1/2 shadow-sm border-t border-r border-gray-100 dark:border-gray-700';
            default: return 'hidden';
        }
    }

    ngOnDestroy() {
        this.clearHighlight();
    }
}
