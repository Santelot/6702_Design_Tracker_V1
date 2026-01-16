import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
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
      <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-3xl"></div>
      </div>

      <!-- Loading State -->
      @if (supabase.loading()) {
        <div class="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
          <div class="text-center">
            <!-- Logo con spinner alrededor -->
            <div class="relative w-32 h-32 mx-auto mb-6">
              <!-- Spinner exterior -->
              <div class="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
              <div class="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              <!-- Logo del equipo centrado -->
              <div class="absolute inset-2 flex items-center justify-center">
                <img 
                  src="Tide Crew Logo.png" 
                  alt="Tide Crew Logo" 
                  class="w-24 h-24 object-contain rounded-full"
                />
              </div>
            </div>
            <p class="text-lg font-medium text-white">Loading FRC Tracker...</p>
            <p class="mt-2 text-sm text-slate-400">Connecting to database</p>
          </div>
        </div>
      }

      <!-- Saving Indicator -->
      @if (supabase.saving()) {
        <div class="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl backdrop-blur-sm">
          <div class="w-4 h-4 border-2 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
          <span class="text-sm text-purple-300">Saving...</span>
        </div>
      }

      <!-- Error State -->
      @if (supabase.error()) {
        <div class="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
          <div class="text-center p-8 max-w-md">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Connection Error</h2>
            <p class="text-slate-400 mb-6">{{ supabase.error() }}</p>
            <button
              (click)="supabase.initialize()"
              class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-violet-700 text-white rounded-xl font-medium transition-all hover:from-purple-500 hover:to-violet-600"
            >
              <svg class="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Retry Connection
            </button>
          </div>
        </div>
      }

      <!-- Main Content -->
      @if (!supabase.loading() && !supabase.error()) {
        <!-- Sidebar -->
        <app-sidebar
          class="relative z-10"
          [activeView]="activeView()"
          [project]="supabase.project()"
          [subsystems]="supabase.subsystems()"
          (viewChange)="activeView.set($event)"
        />

        <!-- Views -->
        <main class="flex-1 relative z-10 ml-72">
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
                [subsystems]="supabase.subsystems()"
              />
            }
            @case ('shopping') {
              <app-shopping-list
                [project]="supabase.project()"
              />
            }
            @case ('inventory') {
              <app-inventory
                [subsystems]="supabase.subsystems()"
              />
            }
            @case ('subsystem') {
              <app-subsystem-view
                [subsystem]="selectedSubsystem()"
                [components]="supabase.components()"
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
  `
})
export class AppComponent implements OnInit {
  supabase = inject(SupabaseService);

  activeView = signal('dashboard');

  currentView = computed(() => {
    const view = this.activeView();
    if (view.startsWith('subsystem-')) {
      return 'subsystem';
    }
    return view;
  });

  selectedSubsystem = computed(() => {
    const view = this.activeView();
    if (view.startsWith('subsystem-')) {
      const id = view.replace('subsystem-', '');
      return this.supabase.subsystems().find(s => s.id === id) || null;
    }
    return null;
  });

  constructor() {
    // Effect to load subsystem components when user selection changes
    effect(() => {
      const subsystem = this.selectedSubsystem();
      if (subsystem) {
        this.supabase.fetchSubsystemComponents(subsystem.id);
      }
    });
  }

  ngOnInit(): void {
    this.supabase.initialize();
  }
}
