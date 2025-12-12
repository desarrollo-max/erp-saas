import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { SalesOpportunity, SalesContact, SalesCompany } from '@core/models/erp.types';

@Component({
  selector: 'app-crm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- KPIs -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Card 1 -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ng-icon name="heroCurrencyDollarSolid" class="h-6 w-6 text-gray-400"></ng-icon>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Valor en Pipeline</dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-gray-900">{{ pipelineValue() | currency }}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                 <ng-icon name="heroChartBarSolid" class="h-6 w-6 text-gray-400"></ng-icon>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Oportunidades Abiertas</dt>
                  <dd class="text-2xl font-semibold text-gray-900">{{ openOpportunitiesCount() }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
           <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                 <ng-icon name="heroBuildingOffice2Solid" class="h-6 w-6 text-gray-400"></ng-icon>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Empresas Activas</dt>
                  <dd class="text-2xl font-semibold text-gray-900">{{ activeCompaniesCount() }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Action -->
         <div class="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-200 flex flex-col justify-center items-center hover:border-indigo-500 cursor-pointer transition-colors p-4" routerLink="opportunities/new">
             <ng-icon name="heroPlusSolid" class="h-8 w-8 text-indigo-500 mb-2"></ng-icon>
             <span class="text-sm font-medium text-gray-600">Nueva Oportunidad</span>
         </div>
      </div>

      <!-- Recent Opportunities -->
      <div class="mt-8">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Oportunidades Recientes</h3>
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <ul class="divide-y divide-gray-200">
             <li *ngFor="let opp of recentOpportunities()" class="hover:bg-gray-50 transition-colors">
                <a [routerLink]="['opportunities', opp.id]" class="block px-4 py-4 sm:px-6">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-indigo-600 truncate">{{ opp.name }}</p>
                    <div class="ml-2 flex-shrink-0 flex">
                      <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {{ opp.amount | currency }}
                      </p>
                    </div>
                  </div>
                  <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                      <p class="flex items-center text-sm text-gray-500">
                        <ng-icon name="heroBuildingOfficeSolid" class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"></ng-icon>
                        {{ opp.sales_companies?.name || 'Sin empresa' }}
                      </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <ng-icon name="heroCalendarSolid" class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"></ng-icon>
                      <p>
                        Cierre estimado: <time [attr.datetime]="opp.expected_close_date">{{ opp.expected_close_date | date }}</time>
                      </p>
                    </div>
                  </div>
                </a>
             </li>
              <li *ngIf="recentOpportunities().length === 0" class="px-4 py-8 text-center text-gray-500 text-sm">
                  No hay oportunidades recientes.
              </li>
          </ul>
        </div>
      </div>

    </div>
  `
})
export class CrmDashboardComponent implements OnInit {
  private salesRepo = inject(SalesRepository);
  private session = inject(SessionService);

  recentOpportunities = signal<SalesOpportunity[]>([]);
  pipelineValue = signal(0);
  openOpportunitiesCount = signal(0);
  activeCompaniesCount = signal(0);

  ngOnInit() {
    this.loadMetrics();
  }

  async loadMetrics() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    try {
      const [opps, companies] = await Promise.all([
        this.salesRepo.getOpportunities(tenantId),
        this.salesRepo.getCompanies(tenantId)
      ]);

      // Calculate Metrics
      this.activeCompaniesCount.set(companies.length);

      const openOpps = opps.filter(o => !['closed_won', 'closed_lost', 'stage_closed_won', 'stage_closed_lost'].includes(o.stage_id));
      this.openOpportunitiesCount.set(openOpps.length);

      const totalValue = openOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
      this.pipelineValue.set(totalValue);

      // Recent (last 5)
      // Assuming ordered by creation or update, or we sort here
      // Model lacks created_at in interface shown in Step 26 but it has updated_at? Yes created_at exists.
      // But repo getOpportunities performs select *, so we have it.
      // We sort manually just in case
      const sorted = [...opps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      this.recentOpportunities.set(sorted.slice(0, 5));

    } catch (e) {
      console.error('Error loading dashboard', e);
    }
  }
}
