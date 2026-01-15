import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-weight-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      @if (showLabels) {
        <div class="flex justify-between text-xs text-slate-400">
          <span>0 kg</span>
          <span class="text-white font-medium">{{ formatWeight(current) }} / {{ formatWeight(effectiveLimit) }}</span>
          <span>{{ formatWeight(limit) }} (limit)</span>
        </div>
      }
      <div class="relative h-4 bg-slate-800/50 rounded-full overflow-hidden">
        <!-- Safety zone indicator -->
        <div
          class="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-rose-500/20 to-transparent"
          [style.width.%]="(safety - 1) * 100"
        ></div>
        <!-- Progress bar -->
        <div
          [class]="'absolute left-0 top-0 bottom-0 bg-gradient-to-r rounded-full transition-all duration-500 shadow-lg ' + barColorClass"
          [style.width.%]="percentage"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
        </div>
        <!-- Warning threshold marker -->
        <div
          class="absolute top-0 bottom-0 w-px bg-amber-500/50"
          style="left: 80%"
        ></div>
        <!-- Danger threshold marker -->
        <div
          class="absolute top-0 bottom-0 w-px bg-rose-500/50"
          style="left: 95%"
        ></div>
      </div>
      @if (showLabels) {
        <div class="flex justify-between text-xs">
          <span [class]="statusClass">{{ percentage.toFixed(1) }}% used</span>
          <span class="text-slate-500">{{ formatWeight(effectiveLimit - current) }} remaining</span>
        </div>
      }
    </div>
  `
})
export class WeightProgressBarComponent {
  @Input() current = 0;
  @Input() limit = 56.699;
  @Input() safety = 1.10;
  @Input() showLabels = true;

  supabase = inject(SupabaseService);

  get effectiveLimit(): number {
    return this.limit / this.safety;
  }

  get percentage(): number {
    return Math.min((this.current / this.effectiveLimit) * 100, 100);
  }

  get barColorClass(): string {
    if (this.percentage >= 95) {
      return 'from-rose-500 to-red-600 shadow-rose-500/50';
    } else if (this.percentage >= 80) {
      return 'from-amber-400 to-orange-500 shadow-amber-500/50';
    }
    return 'from-emerald-400 to-green-500 shadow-emerald-500/50';
  }

  get statusClass(): string {
    if (this.percentage >= 95) {
      return 'text-rose-400 font-medium';
    } else if (this.percentage >= 80) {
      return 'text-amber-400';
    }
    return 'text-emerald-400';
  }

  formatWeight(kg: number): string {
    return this.supabase.formatWeight(kg);
  }
}
