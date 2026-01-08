import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-label-designer-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './history.component.html'
})
export class LabelDesignerHistoryComponent {}
