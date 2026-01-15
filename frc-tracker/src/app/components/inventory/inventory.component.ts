import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Subsystem, InventoryItem } from '../../models';
import { GlassCardComponent, StatCardComponent, ButtonComponent } from '../shared';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, GlassCardComponent, StatCardComponent, ButtonComponent],
  template: `
    <div class="flex-1 overflow-y-auto p-8">
      <div class="flex items-start justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Inventory</h1>
          <p class="text-slate-400">Complete component inventory by subsystem</p>
        </div>
        <div class="flex gap-3">
          <app-button variant="secondary" icon="refresh" (click)="refresh()">Refresh</app-button>
          <app-button variant="primary" icon="download">Export</app-button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-6">
        <div class="space-y-1.5 w-48">
          <label class="block text-xs font-medium text-slate-400">Subsystem</label>
          <select
            [(ngModel)]="selectedSubsystem"
            class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Subsystems</option>
            @for (sub of subsystems; track sub.id) {
              <option [value]="sub.id">{{ sub.name }}</option>
            }
          </select>
        </div>
        <div class="space-y-1.5 w-40">
          <label class="block text-xs font-medium text-slate-400">Status</label>
          <select
            [(ngModel)]="statusFilter"
            class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="installed">Installed</option>
          </select>
        </div>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-4 gap-4 mb-8">
        <app-stat-card
          title="Total Items"
          [value]="filteredInventory().length.toString()"
          icon="box"
          color="purple"
        />
        <app-stat-card
          title="Total Units"
          [value]="getTotalUnits().toString()"
          icon="layers"
          color="cyan"
        />
        <app-stat-card
          title="In Stock"
          [value]="getInStockCount().toString()"
          icon="check"
          color="emerald"
        />
        <app-stat-card
          title="Est. Value"
          [value]="'$' + getTotalValue().toFixed(2)"
          icon="cart"
          color="amber"
        />
      </div>

      <!-- Table -->
      <app-glass-card>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Component</th>
                <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Subsystem</th>
                <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Category</th>
                <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Qty</th>
                <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Stock</th>
                <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Cost</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              @for (item of filteredInventory(); track item.component_id) {
                <tr class="hover:bg-white/5">
                  <td class="px-5 py-4">
                    <div>
                      <p class="text-white font-medium">{{ item.component_name }}</p>
                      @if (item.part_number) {
                        <p class="text-xs text-slate-500 mt-0.5">PN: {{ item.part_number }}</p>
                      }
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-2 h-2 rounded-full"
                        [style.backgroundColor]="getSubsystemColor(item.subsystem_id)"
                      ></div>
                      <span class="text-slate-300">{{ item.subsystem_name }}</span>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-slate-400">{{ item.category_name || '—' }}</td>
                  <td class="px-5 py-4 text-center text-white">{{ item.quantity_needed }}</td>
                  <td class="px-5 py-4 text-center">
                    @if (item.in_stock) {
                      <span class="text-emerald-400">{{ item.stock_quantity }}</span>
                    } @else {
                      <span class="text-slate-500">0</span>
                    }
                  </td>
                  <td class="px-5 py-4 text-center">
                    <span [class]="getStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right text-slate-400">
                    {{ item.total_cost ? '$' + toNumber(item.total_cost).toFixed(2) : '—' }}
                  </td>
                </tr>
              }
              @if (filteredInventory().length === 0) {
                <tr>
                  <td colspan="7" class="px-5 py-12 text-center text-slate-500">
                    <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    <p>No items found</p>
                    <p class="text-sm mt-1">Add components to your subsystems to see them here</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-glass-card>
    </div>
  `
})
export class InventoryComponent {
  @Input() inventory: InventoryItem[] = [];
  @Input() subsystems: Subsystem[] = [];

  supabase = inject(SupabaseService);

  selectedSubsystem = 'all';
  statusFilter = 'all';

  statusColors: Record<string, string> = {
    planned: 'bg-slate-500/20 text-slate-400',
    ordered: 'bg-amber-500/20 text-amber-400',
    received: 'bg-cyan-500/20 text-cyan-400',
    installed: 'bg-emerald-500/20 text-emerald-400',
    removed: 'bg-rose-500/20 text-rose-400',
  };

  filteredInventory(): InventoryItem[] {
    return this.inventory.filter(item => {
      if (this.selectedSubsystem !== 'all' && item.subsystem_id !== this.selectedSubsystem) return false;
      if (this.statusFilter !== 'all' && item.status !== this.statusFilter) return false;
      return true;
    });
  }

  toNumber(value: any): number {
    return parseFloat(value) || 0;
  }

  getTotalUnits(): number {
    return this.filteredInventory().reduce((sum, i) => sum + i.quantity_needed, 0);
  }

  getInStockCount(): number {
    return this.filteredInventory().filter(i => i.in_stock).length;
  }

  getTotalValue(): number {
    return this.filteredInventory().reduce((sum, i) => sum + this.toNumber(i.total_cost), 0);
  }

  getSubsystemColor(subsystemId: string): string {
    const sub = this.subsystems.find(s => s.id === subsystemId);
    return sub?.color || '#6B7280';
  }

  getStatusClass(status: string): string {
    return `px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${this.statusColors[status] || this.statusColors['planned']}`;
  }

  refresh(): void {
    this.supabase.fetchAllData();
  }
}
