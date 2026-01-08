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
  templateUrl: './crm-dashboard.component.html'
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
