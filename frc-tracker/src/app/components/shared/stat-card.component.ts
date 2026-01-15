import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlassCardComponent } from './glass-card.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, GlassCardComponent],
  template: `
    <app-glass-card [class]="large ? 'col-span-2' : ''">
      <div class="p-5">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{{ title }}</p>
            <p [class]="'font-bold text-white tracking-tight ' + (large ? 'text-4xl' : 'text-2xl')">{{ value }}</p>
            @if (subtitle) {
              <p class="text-sm text-slate-400 mt-1">{{ subtitle }}</p>
            }
          </div>
          <div [class]="'p-3 rounded-xl bg-gradient-to-br shadow-lg ' + getColorClass()">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath()"></path>
            </svg>
          </div>
        </div>
      </div>
    </app-glass-card>
  `
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() subtitle = '';
  @Input() icon = 'box';
  @Input() color: 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' = 'purple';
  @Input() large = false;

  private colorClasses: Record<string, string> = {
    purple: 'from-purple-500 to-violet-600',
    cyan: 'from-cyan-400 to-blue-500',
    emerald: 'from-emerald-400 to-green-600',
    amber: 'from-amber-400 to-orange-500',
    rose: 'from-rose-400 to-pink-600',
    slate: 'from-slate-400 to-slate-600',
  };

  private iconPaths: Record<string, string> = {
    scale: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    target: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    layers: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    package: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    wrench: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
    cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  getColorClass(): string {
    return this.colorClasses[this.color] || this.colorClasses['purple'];
  }

  getIconPath(): string {
    return this.iconPaths[this.icon] || this.iconPaths['box'];
  }
}
