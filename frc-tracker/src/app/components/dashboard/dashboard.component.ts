import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Project, ProjectWeightSummary, SubsystemWeightSummary, CategoryWeightSummary } from '../../models';
import { GlassCardComponent, StatCardComponent, WeightProgressBarComponent } from '../shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, GlassCardComponent, StatCardComponent, WeightProgressBarComponent],
  template: `
    <div class="flex-1 overflow-y-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p class="text-slate-400">Real-time weight tracking for {{ project?.name }}</p>
      </div>

      @if (project && summary) {
        <!-- Main Weight Progress -->
        <app-glass-card class="mb-8" [glow]="true">
          <div class="p-6">
            <div class="flex items-center gap-4 mb-6">
              <div class="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">Total Robot Weight</h2>
                <p class="text-sm text-slate-400">
                  FRC limit: {{ supabase.formatWeight(project.weight_limit_kg) }} •
                  Safety factor: {{ ((project.safety_factor - 1) * 100).toFixed(0) }}%
                </p>
              </div>
            </div>
            <app-weight-progress-bar
              [current]="toNumber(summary.total_weight_kg)"
              [limit]="project.weight_limit_kg"
              [safety]="project.safety_factor"
            />
          </div>
        </app-glass-card>

        <!-- Stats Grid -->
        <div class="grid grid-cols-4 gap-4 mb-8">
          <app-stat-card
            title="Total Weight"
            [value]="supabase.formatWeight(summary.total_weight_kg)"
            icon="scale"
            color="purple"
          />
          <app-stat-card
            title="Remaining"
            [value]="supabase.formatWeight(summary.remaining_weight_kg)"
            icon="target"
            [color]="toNumber(summary.remaining_weight_kg) < 2 ? 'rose' : 'emerald'"
          />
          <app-stat-card
            title="Subsystems"
            [value]="summary.subsystem_count?.toString() || '0'"
            icon="layers"
            color="cyan"
          />
          <app-stat-card
            title="Components"
            [value]="summary.component_count?.toString() || '0'"
            icon="box"
            color="amber"
          />
        </div>

        <!-- Subsystem Cards -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            Subsystem Breakdown
          </h3>
          <div class="grid grid-cols-2 gap-4">
            @for (sub of subsystemSummary; track sub.subsystem_id) {
              <app-glass-card (click)="navigate.emit('subsystem-' + sub.subsystem_id)" class="cursor-pointer">
                <div class="p-5">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-3 h-3 rounded-full shadow-lg"
                        [style.backgroundColor]="sub.color"
                        [style.boxShadow]="'0 0 12px ' + sub.color + '40'"
                      ></div>
                      <div>
                        <h4 class="font-semibold text-white">{{ sub.name }}</h4>
                        <p class="text-xs text-slate-400">{{ sub.component_count }} components</p>
                      </div>
                    </div>
                    <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-slate-400">Weight</span>
                      <span class="text-white font-medium">{{ supabase.formatWeight(sub.total_weight_kg) }}</span>
                    </div>
                    @if (sub.weight_budget_kg) {
                      <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-300"
                          [style.width.%]="getSubsystemProgress(sub)"
                          [style.backgroundColor]="sub.color"
                        ></div>
                      </div>
                      <div class="flex justify-between text-xs text-slate-500">
                        <span>{{ supabase.formatPercent(sub.budget_used_percent) }} of budget</span>
                        <span>{{ supabase.formatWeight(sub.weight_budget_kg) }} budget</span>
                      </div>
                    }
                  </div>
                </div>
              </app-glass-card>
            }
          </div>
        </div>

        <!-- Category Distribution -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
            </svg>
            Weight by Category
          </h3>
          <app-glass-card>
            <div class="p-5 space-y-3">
              @for (cat of getActiveCategories(); track cat.category_id) {
                <div class="flex items-center gap-4">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    [style.backgroundColor]="cat.color + '20'"
                  >
                    <svg class="w-5 h-5" [style.color]="cat.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getCategoryIcon(cat.category_slug)"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="text-sm text-white font-medium">{{ cat.category_name }}</span>
                      <span class="text-sm text-slate-400">{{ supabase.formatWeight(cat.total_weight_kg) }}</span>
                    </div>
                    <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [style.width.%]="getCategoryPercent(cat)"
                        [style.backgroundColor]="cat.color"
                      ></div>
                    </div>
                  </div>
                  <span class="text-xs text-slate-500 w-12 text-right">
                    {{ supabase.formatPercent(getCategoryPercent(cat)) }}
                  </span>
                </div>
              }
            </div>
          </app-glass-card>
        </div>
      } @else {
        <!-- Loading placeholder -->
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <svg class="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
            </svg>
            <p class="text-slate-400">Loading project data...</p>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  @Input() project: Project | null = null;
  @Input() summary: ProjectWeightSummary | null = null;
  @Input() subsystemSummary: SubsystemWeightSummary[] = [];
  @Input() categorySummary: CategoryWeightSummary[] = [];
  @Output() navigate = new EventEmitter<string>();

  supabase = inject(SupabaseService);

  categoryIcons: Record<string, string> = {
    'structure': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    'hardware': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    'fasteners': 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
    'electronics': 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
    'pneumatics': 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
    'custom': 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
    'cots': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    'other': 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'
  };

  toNumber(value: any): number {
    return parseFloat(value) || 0;
  }

  getSubsystemProgress(sub: SubsystemWeightSummary): number {
    if (!sub.weight_budget_kg) return 0;
    return Math.min((this.toNumber(sub.total_weight_kg) / this.toNumber(sub.weight_budget_kg)) * 100, 100);
  }

  getActiveCategories(): CategoryWeightSummary[] {
    return this.categorySummary.filter(c => this.toNumber(c.total_weight_kg) > 0);
  }

  getCategoryPercent(cat: CategoryWeightSummary): number {
    const total = this.toNumber(this.summary?.total_weight_kg);
    if (total <= 0) return 0;
    return (this.toNumber(cat.total_weight_kg) / total) * 100;
  }

  getCategoryIcon(slug: string): string {
    return this.categoryIcons[slug] || this.categoryIcons['other'];
  }
}
