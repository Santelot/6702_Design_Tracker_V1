import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './services/supabase.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SubsystemViewComponent } from './components/subsystem-view/subsystem-view.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ShoppingListComponent } from './components/shopping-list/shopping-list.component';
import { InventoryComponent } from './components/inventory/inventory.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    DashboardComponent,
    SubsystemViewComponent,
    SettingsComponent,
    ShoppingListComponent,
    InventoryComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-950 flex">
      <!-- Background Effects -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-3xl"></div>
      </div>

      <!-- Loading State -->
      @if (supabase.loading()) {
        <div class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="relative">
              <div class="w-20 h-20 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500"></div>
              <svg class="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
              </svg>
            </div>
            <p class="mt-6 text-slate-400 font-medium">Loading FRC Tracker...</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @else if (supabase.error()) {
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] p-8 max-w-md text-center">
            <svg class="w-16 h-16 text-rose-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <h2 class="text-xl font-bold text-white mb-2">Connection Error</h2>
            <p class="text-slate-400 mb-6">{{ supabase.error() }}</p>
            <button
              (click)="supabase.fetchAllData()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-xl font-medium transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Retry Connection
            </button>
          </div>
        </div>
      }

      <!-- Main Content -->
      @else {
        <!-- Sidebar -->
        <app-sidebar
          [activeView]="activeView()"
          [project]="supabase.project()"
          [subsystems]="supabase.subsystems()"
          (viewChange)="activeView.set($event)"
        />

        <!-- Views -->
        <main class="flex-1 relative">
          @switch (currentView()) {
            @case ('dashboard') {
              <app-dashboard
                [project]="supabase.project()"
                [summary]="supabase.projectSummary()"
                [subsystemSummary]="supabase.subsystemSummary()"
                [categorySummary]="supabase.categorySummary()"
                (navigate)="activeView.set($event)"
              />
            }
            @case ('settings') {
              <app-settings
                [project]="supabase.project()"
                [materials]="supabase.materials()"
                [profiles]="supabase.profiles()"
                [fasteners]="supabase.fasteners()"
                [categories]="supabase.categories()"
              />
            }
            @case ('shopping') {
              <app-shopping-list
                [project]="supabase.project()"
                [shoppingList]="supabase.fastenerShoppingList()"
              />
            }
            @case ('inventory') {
              <app-inventory
                [inventory]="supabase.inventory()"
                [subsystems]="supabase.subsystems()"
              />
            }
            @case ('subsystem') {
              <app-subsystem-view
                [subsystem]="currentSubsystem()"
                [components]="currentComponents()"
                [categories]="supabase.categories()"
                [materials]="supabase.materials()"
                [profiles]="supabase.profiles()"
                [fasteners]="supabase.fasteners()"
              />
            }
          }
        </main>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AppComponent implements OnInit {
  supabase = inject(SupabaseService);

  activeView = signal('dashboard');

  currentView = computed(() => {
    const view = this.activeView();
    if (view.startsWith('subsystem-')) return 'subsystem';
    return view;
  });

  currentSubsystemId = computed(() => {
    const view = this.activeView();
    if (view.startsWith('subsystem-')) {
      return view.replace('subsystem-', '');
    }
    return null;
  });

  currentSubsystem = computed(() => {
    const id = this.currentSubsystemId();
    if (!id) return null;
    return this.supabase.subsystems().find(s => s.id === id) || null;
  });

  currentComponents = computed(() => {
    const id = this.currentSubsystemId();
    if (!id) return [];
    return this.supabase.components().filter(c => c.subsystem_id === id);
  });

  ngOnInit(): void {
    this.supabase.fetchAllData();
  }
}
