import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project, Subsystem } from '../../models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-72 h-screen flex flex-col bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-r border-white/5">
      <!-- Logo -->
      <div class="p-6 border-b border-white/5">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
            </svg>
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
          <p class="text-xs text-slate-400 mt-1">Team {{ project.team_number }} • {{ project.season_year }}</p>
        </div>
      }

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        @for (item of navItems; track item.id) {
          <button
            (click)="viewChange.emit(item.id)"
            [class]="getNavItemClass(item.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.icon"></path>
            </svg>
            {{ item.label }}
          </button>
        }

        <!-- Subsystems Section -->
        <div class="pt-4">
          <button
            (click)="subsystemsExpanded.set(!subsystemsExpanded())"
            class="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>Subsystems</span>
            <svg class="w-4 h-4 transition-transform" [class.rotate-180]="subsystemsExpanded()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          @if (subsystemsExpanded()) {
            <div class="mt-1 space-y-1">
              @for (sub of subsystems; track sub.id) {
                <button
                  (click)="viewChange.emit('subsystem-' + sub.id)"
                  [class]="getSubsystemClass(sub.id)"
                >
                  <div
                    class="w-2 h-2 rounded-full"
                    [style.backgroundColor]="sub.color"
                  ></div>
                  <span class="truncate">{{ sub.name }}</span>
                </button>
              }

              @if (subsystems.length === 0) {
                <p class="px-4 py-2 text-xs text-slate-500 italic">No subsystems yet</p>
              }
            </div>
          }
        </div>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-white/5">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
          <span>Dark Mode Active</span>
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

  getNavItemClass(itemId: string): string {
    const base = 'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200';
    if (this.activeView === itemId) {
      return `${base} bg-gradient-to-r from-purple-500/20 to-violet-600/20 text-white border border-purple-500/30`;
    }
    return `${base} text-slate-400 hover:text-white hover:bg-white/5`;
  }

  getSubsystemClass(subsystemId: string): string {
    const base = 'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200';
    if (this.activeView === `subsystem-${subsystemId}`) {
      return `${base} bg-white/10 text-white`;
    }
    return `${base} text-slate-400 hover:text-white hover:bg-white/5`;
  }
}
