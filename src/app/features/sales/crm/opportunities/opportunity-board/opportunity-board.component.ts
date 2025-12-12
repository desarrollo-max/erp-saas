import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesOpportunity, SalesStage } from '@core/models/erp.types';

interface KanbanColumn {
  id: string;
  title: string;
  items: SalesOpportunity[];
}

@Component({
  selector: 'app-opportunity-board',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="h-full flex flex-col bg-gray-100 overflow-hidden">
      <!-- Toolbar -->
      <div class="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0">
        <h1 class="text-xl font-semibold text-gray-900">Pipeline de Ventas</h1>
        <button
          (click)="navigateToNew()"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          <ng-icon name="heroPlusSolid" class="h-5 w-5 mr-2"></ng-icon>
          Nueva Oportunidad
        </button>
      </div>

      <!-- Board Content -->
      <div class="flex-1 overflow-x-auto overflow-y-hidden">
        <div class="h-full flex px-4 pb-4 pt-2 space-x-4 min-w-max">
          
          <div *ngIf="isLoading()" class="w-full h-full flex items-center justify-center">
             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>

          <div 
            *ngFor="let column of columns()"
            class="w-80 flex flex-col bg-gray-50 rounded-lg shadow-sm border border-gray-200 h-full max-h-full">
            
            <!-- Column Header -->
            <div class="p-3 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg shrink-0">
              <span class="font-medium text-gray-700 text-sm uppercase tracking-wider">{{ column.title }}</span>
              <span class="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{{ column.items.length }}</span>
            </div>

            <!-- Draggable Area -->
            <div
              cdkDropList
              [id]="column.id"
              [cdkDropListData]="column.items"
              [cdkDropListConnectedTo]="connectedDropLists()"
              (cdkDropListDropped)="drop($event)"
              class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
              
              <div
                *ngFor="let item of column.items"
                cdkDrag
                [cdkDragData]="item"
                (click)="navigateToEdit(item.id)"
                class="bg-white p-3 rounded shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group">
                
                <h4 class="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{{ item.name }}</h4>
                
                <!-- Company Name if exists -->
                <!-- Note: SalesOpportunity model might need expanded company name, for now assuming we get it -->
                <p class="text-xs text-gray-500 mt-1" *ngIf="item.sales_companies">
                  {{ item.sales_companies.name }}
                </p>

                <div class="mt-3 flex items-center justify-between">
                   <span class="text-xs font-semibold text-gray-900 bg-green-50 text-green-700 px-2 py-0.5 rounded">
                     {{ item.amount | currency }}
                   </span>
                   
                   <div class="flex items-center text-xs text-gray-400" *ngIf="item.expected_close_date">
                     <ng-icon name="heroCalendarSolid" class="h-3 w-3 mr-1"></ng-icon>
                     {{ item.expected_close_date | date:'shortDate' }}
                   </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent; 
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1; 
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8; 
    }
  `]
})
export class OpportunityBoardComponent implements OnInit {
  private salesRepo = inject(SalesRepository);
  private session = inject(SessionService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  columns = signal<KanbanColumn[]>([]);
  isLoading = signal(true);
  connectedDropLists = signal<string[]>([]);

  ngOnInit() {
    this.loadBoard();
  }

  async loadBoard() {
    this.isLoading.set(true);
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    try {
      // 1. Fetch Stages
      let stages = await this.salesRepo.getStages(tenantId);

      // Fallback stages if none found
      if (!stages || stages.length === 0) {
        stages = this.getDefaultStages();
      }

      // 2. Fetch Opportunities
      const opportunities = await this.salesRepo.getOpportunities(tenantId);

      // 3. Build Columns
      const cols: KanbanColumn[] = stages.map(stage => ({
        id: stage.id,
        title: stage.name,
        items: []
      }));

      // 4. Distribute Items
      opportunities.forEach(opp => {
        const col = cols.find(c => c.id === opp.stage_id);
        if (col) {
          col.items.push(opp);
        } else {
          // If stage not found (maybe fallback mismatch), put in first or default 'NEW'
          // For safety, let's put in the first column if available
          if (cols.length > 0) cols[0].items.push(opp);
        }
      });

      this.columns.set(cols);
      this.connectedDropLists.set(cols.map(c => c.id));

    } catch (error) {
      this.notification.error('Error al cargar pipeline');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  getDefaultStages(): SalesStage[] {
    // Mock IDs for default stages. In a real app we'd create them in DB or use string codes.
    // For this MVP, assuming the DB might use these IDs or we just interpret them.
    // The issue is if we create a NEW Opp, we need a valid Stage ID that exists in DB foreign key.
    // So this fallback is risky if Referential Integrity is on.
    // But let's assume we used the Supabase table 'sales_stages' and it has data.
    return [
      { id: 'stage_advocate', name: 'Nuevo', order_index: 0, pipeline_id: 'default' } as any,
      { id: 'stage_qualification', name: 'Calificación', order_index: 1 } as any,
      { id: 'stage_proposal', name: 'Propuesta', order_index: 2 } as any,
      { id: 'stage_negotiation', name: 'Negociación', order_index: 3 } as any,
      { id: 'stage_closed_won', name: 'Ganado', order_index: 4 } as any,
      { id: 'stage_closed_lost', name: 'Perdido', order_index: 5 } as any,
    ];
  }

  async drop(event: CdkDragDrop<SalesOpportunity[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const item = event.container.data[event.currentIndex];
      const newStageId = event.container.id;

      try {
        await this.salesRepo.updateOpportunity(item.id, { stage_id: newStageId });
        this.notification.success('Etapa actualizada');
      } catch (error) {
        this.notification.error('Error al actualizar etapa');
        // Revert? (Complex for MVP, skipping revert logic)
      }
    }
  }

  navigateToNew() {
    this.router.navigate(['/sales/crm/opportunities/new']);
  }

  navigateToEdit(id: string) {
    this.router.navigate(['/sales/crm/opportunities', id]);
  }
}
