import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project, Subsystem } from '../../models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-72 h-screen flex flex-col bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-r border-white/5 fixed top-0 left-0 z-40">
      <!-- Logo -->
      <div class="p-6 border-b border-white/5">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 shadow-lg shadow-purple-500/20 overflow-hidden flex items-center justify-center">
            <img 
              src="Tide Crew Logo.png" 
              alt="Team Logo" 
              class="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 class="font-bold text-white text-lg tracking-tight">FRC Tracker</h1>
            <p class="text-xs text-slate-500">Design Weight Manager</p>
          </div>
        </div>
      </div>

      <!-- Project Info -->
      @if (project) {
        <div class="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/20">
          <p class="text-xs text-purple-300 font-medium">Active Project</p>
          <p class="text-white font-semibold truncate">{{ project.name }}</p>
          <p class="text-xs text-slate-400 mt-1">
            Team {{ project.team_number || '????' }} • {{ project.season_year || 2026 }}
          </p>
        </div>
      }

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        @for (item of navItems; track item.id) {
          <button
            (click)="viewChange.emit(item.id)"
            [class]="getNavItemClass(item.id)"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.icon"></path>
            </svg>
            <span>{{ item.label }}</span>
          </button>
        }

        <!-- Subsystems Section -->
        <div class="pt-4">
          <button
            (click)="subsystemsExpanded.set(!subsystemsExpanded())"
            class="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-white transition-colors"
          >
            <span>Subsystems</span>
            <svg
              class="w-4 h-4 transition-transform duration-200"
              [class.rotate-180]="!subsystemsExpanded()"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          @if (subsystemsExpanded()) {
            <div class="mt-2 space-y-2">
              @for (sub of subsystems; track sub.id; let i = $index) {
                <button
                  (click)="viewChange.emit('subsystem-' + sub.id)"
                  [class]="getSubsystemClass('subsystem-' + sub.id)"
                  [style]="getSubsystemStyle(sub.color, 'subsystem-' + sub.id)"
                >
                  <!-- Color accent bar -->
                  <div 
                    class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all duration-300"
                    [style.backgroundColor]="sub.color"
                    [class.w-1.5]="activeView === 'subsystem-' + sub.id"
                  ></div>
                  
                  <!-- Content -->
                  <div class="flex items-center gap-3 pl-3">
                    <!-- Icon with glow -->
                    <div 
                      class="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                      [style]="getIconContainerStyle(sub.color)"
                    >
                      <div 
                        class="absolute inset-0 rounded-lg opacity-50 blur-sm"
                        [style.backgroundColor]="sub.color"
                      ></div>
                      <span class="relative z-10 text-white text-sm font-bold">{{ i + 1 }}</span>
                    </div>
                    
                    <!-- Text -->
                    <div class="flex-1 text-left min-w-0">
                      <p class="text-sm font-medium truncate text-white/90">{{ sub.name }}</p>
                      <p class="text-xs text-slate-500 truncate">{{ getSubsystemSubtitle(sub) }}</p>
                    </div>
                    
                    <!-- Arrow indicator -->
                    <svg 
                      class="w-4 h-4 text-slate-600 transition-all duration-300 group-hover:text-slate-400 group-hover:translate-x-0.5"
                      [class.text-white]="activeView === 'subsystem-' + sub.id"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </button>
              }

              @if (subsystems.length === 0) {
                <div class="px-4 py-6 text-center">
                  <div class="w-12 h-12 mx-auto rounded-xl bg-slate-800/50 flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                  <p class="text-xs text-slate-500">No subsystems yet</p>
                  <p class="text-xs text-slate-600 mt-1">Create one to get started</p>
                </div>
              }
            </div>
          }
        </div>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-white/5">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <span>Dark Mode</span>
          </div>
          <span class="text-slate-600">v1.0</span>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() activeView = '';
  @Input() project: Project | null = null;
  @Input() subsystems: Subsystem[] = [];
  @Output() viewChange = new EventEmitter<string>();

  subsystemsExpanded = signal(true);

  navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'shopping', label: 'Shopping List', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'inventory', label: 'Inventory', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  handleLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  getNavItemClass(itemId: string): string {
    const base = 'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200';
    if (this.activeView === itemId) {
      return `${base} bg-gradient-to-r from-purple-500/20 to-violet-600/20 text-white border border-purple-500/30`;
    }
    return `${base} text-slate-400 hover:text-white hover:bg-white/5`;
  }

  getSubsystemClass(subsystemId: string): string {
    const base = 'group relative w-full rounded-xl overflow-hidden transition-all duration-300 py-3 pr-3';
    if (this.activeView === subsystemId) {
      return `${base} bg-white/[0.08] backdrop-blur-sm border border-white/10 shadow-lg`;
    }
    return `${base} bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5`;
  }

  getSubsystemStyle(color: string, subsystemId: string): string {
    const isActive = this.activeView === subsystemId;
    if (isActive) {
      return `background: linear-gradient(135deg, ${this.hexToRgba(color, 0.15)} 0%, ${this.hexToRgba(color, 0.05)} 100%);`;
    }
    return '';
  }

  getIconContainerStyle(color: string): string {
    return `background: linear-gradient(135deg, ${this.hexToRgba(color, 0.3)} 0%, ${this.hexToRgba(color, 0.15)} 100%);`;
  }

  getSubsystemSubtitle(sub: Subsystem): string {
    // Puedes personalizar esto según los datos que tengas en tu modelo
    return 'Subsystem';
  }

  private hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
