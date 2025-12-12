import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-ai-core',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="ai-core-container" [class.processing]="isProcessing">
      <div class="ai-sphere">
        <div class="ai-ring ring-1"></div>
        <div class="ai-ring ring-2"></div>
        <div class="ai-ring ring-3"></div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: inline-block;
    }

    .ai-core-container {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .ai-sphere {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, var(--ai-core-primary), var(--ai-core-secondary));
      box-shadow: 0 0 20px var(--ai-core-glow), inset 0 0 10px rgba(255,255,255,0.4);
      position: relative;
      z-index: 10;
      animation: breathe 4s ease-in-out infinite;
      transform-style: preserve-3d;
    }

    /* Rings for extra depth/effect */
    .ai-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 5px var(--ai-core-primary);
      opacity: 0.6;
    }

    .ring-1 { width: 50px; height: 50px; animation: spin 10s linear infinite; border-color: var(--ai-core-primary); }
    .ring-2 { width: 60px; height: 60px; animation: spin-reverse 15s linear infinite; border-color: var(--ai-core-secondary); }
    
    /* Processing State */
    .processing .ai-sphere {
      animation: pulse-fast 0.8s ease-in-out infinite alternate;
      box-shadow: 0 0 30px var(--ai-core-primary), inset 0 0 20px rgba(255,255,255,0.8);
    }

    .processing .ring-1, .processing .ring-2 {
      animation-duration: 2s;
    }

    /* Animations */
    @keyframes breathe {
      0%, 100% { transform: scale(0.95); box-shadow: 0 0 15px var(--ai-core-glow); }
      50% { transform: scale(1.05); box-shadow: 0 0 25px var(--ai-core-glow); }
    }

    @keyframes pulse-fast {
      0% { transform: scale(0.95); box-shadow: 0 0 20px var(--ai-core-primary); }
      100% { transform: scale(1.1); box-shadow: 0 0 40px var(--ai-core-primary); }
    }

    @keyframes spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    @keyframes spin-reverse {
      from { transform: translate(-50%, -50%) rotate(360deg); }
      to { transform: translate(-50%, -50%) rotate(0deg); }
    }
  `]
})
export class AiCoreComponent {
    @Input() isProcessing = false;
}
