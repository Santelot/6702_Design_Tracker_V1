import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Project, FastenerShoppingItem } from '../../models';
import { GlassCardComponent, StatCardComponent, ButtonComponent } from '../shared';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, GlassCardComponent, StatCardComponent, ButtonComponent],
  template: `
    <div class="flex-1 overflow-y-auto p-8">
      <div class="flex items-start justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Shopping List</h1>
          <p class="text-slate-400">Components and fasteners that need to be purchased</p>
        </div>
        <div class="flex gap-3">
          <app-button variant="secondary" icon="refresh" (click)="refresh()">Refresh</app-button>
          <app-button variant="primary" icon="download">Export CSV</app-button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <app-stat-card
          title="Fastener Types"
          [value]="shoppingList.length.toString()"
          icon="wrench"
          color="purple"
        />
        <app-stat-card
          title="Total Units Needed"
          [value]="getTotalUnits().toString()"
          icon="package"
          color="cyan"
        />
        <app-stat-card
          title="Estimated Cost"
          [value]="'$' + getTotalCost().toFixed(2)"
          icon="cart"
          color="emerald"
        />
      </div>

      <!-- Fasteners Table -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path>
          </svg>
          Fasteners to Purchase
        </h3>
        <app-glass-card>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Fastener</th>
                  <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Thread</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Needed</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">In Stock</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">To Buy</th>
                  <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Est. Cost</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Supplier</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (item of shoppingList; track item.fastener_id) {
                  <tr class="hover:bg-white/5">
                    <td class="px-5 py-4 text-white font-medium">{{ item.fastener_name }}</td>
                    <td class="px-5 py-4 text-slate-400">{{ item.thread_size }}</td>
                    <td class="px-5 py-4 text-center text-white">{{ item.total_needed }}</td>
                    <td class="px-5 py-4 text-center text-slate-400">{{ item.total_in_stock }}</td>
                    <td class="px-5 py-4 text-center">
                      <span class="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-semibold">
                        {{ item.to_purchase }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-right text-emerald-400">
                      {{ item.estimated_cost ? '$' + toNumber(item.estimated_cost).toFixed(2) : '—' }}
                    </td>
                    <td class="px-5 py-4 text-center">
                      @if (item.purchase_url) {
                        <a
                          [href]="item.purchase_url"
                          target="_blank"
                          class="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          {{ item.supplier || 'Link' }}
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                          </svg>
                        </a>
                      } @else {
                        <span class="text-slate-500">{{ item.supplier || '—' }}</span>
                      }
                    </td>
                  </tr>
                }
                @if (shoppingList.length === 0) {
                  <tr>
                    <td colspan="7" class="px-5 py-12 text-center text-slate-500">
                      <svg class="w-12 h-12 mx-auto mb-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p class="text-emerald-400 font-medium">All fasteners in stock!</p>
                      <p class="text-sm mt-1">No fasteners need to be purchased</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </app-glass-card>
      </div>
    </div>
  `
})
export class ShoppingListComponent {
  @Input() project: Project | null = null;
  @Input() shoppingList: FastenerShoppingItem[] = [];

  supabase = inject(SupabaseService);

  toNumber(value: any): number {
    return parseFloat(value) || 0;
  }

  getTotalUnits(): number {
    return this.shoppingList.reduce((sum, item) => sum + (parseInt(item.to_purchase as any) || 0), 0);
  }

  getTotalCost(): number {
    return this.shoppingList.reduce((sum, item) => sum + (this.toNumber(item.estimated_cost)), 0);
  }

  refresh(): void {
    this.supabase.fetchAllData();
  }
}
