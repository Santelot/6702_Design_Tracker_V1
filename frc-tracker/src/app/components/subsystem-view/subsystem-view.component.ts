import { Component, Input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import {
  Subsystem, Component as ComponentModel, ComponentCategory,
  Material, ProfileType, Fastener, NewComponent
} from '../../models';
import { GlassCardComponent, StatCardComponent, ButtonComponent, ModalComponent } from '../shared';

@Component({
  selector: 'app-subsystem-view',
  standalone: true,
  imports: [CommonModule, FormsModule, GlassCardComponent, StatCardComponent, ButtonComponent, ModalComponent],
  template: `
    @if (subsystem) {
      <div class="flex-1 overflow-y-auto p-8">
        <!-- Header -->
        <div class="flex items-start justify-between mb-8">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              [style.backgroundColor]="subsystem.color + '20'"
            >
              <div
                class="w-4 h-4 rounded-full"
                [style.backgroundColor]="subsystem.color"
                [style.boxShadow]="'0 0 16px ' + subsystem.color"
              ></div>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-white">{{ subsystem.name }}</h1>
              @if (subsystem.description) {
                <p class="text-slate-400 mt-1">{{ subsystem.description }}</p>
              }
            </div>
          </div>
          <div class="flex items-center gap-3">
            <app-button variant="secondary" icon="refresh" (click)="refresh()">Refresh</app-button>
            <app-button variant="primary" icon="plus" (click)="isAddingComponent.set(true)">Add Component</app-button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-8">
          <app-stat-card
            title="Total Weight"
            [value]="supabase.formatWeight(subsystemWeight())"
            icon="scale"
            color="purple"
          />
          <app-stat-card
            title="Components"
            [value]="components.length.toString()"
            icon="box"
            color="cyan"
          />
          @if (subsystem.weight_budget_kg) {
            <app-stat-card
              title="Budget Used"
              [value]="supabase.formatPercent(budgetPercent())"
              [subtitle]="'of ' + supabase.formatWeight(subsystem.weight_budget_kg)"
              icon="target"
              [color]="subsystemWeight() > (subsystem.weight_budget_kg || 0) ? 'rose' : 'emerald'"
            />
          }
        </div>

        <!-- Category Filter -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            (click)="activeCategory.set('all')"
            [class]="getCategoryButtonClass('all')"
          >
            All ({{ components.length }})
          </button>
          @for (cat of categories; track cat.id) {
            <button
              (click)="activeCategory.set(cat.id)"
              [class]="getCategoryButtonClass(cat.id)"
            >
              <span class="w-2 h-2 rounded-full" [style.backgroundColor]="cat.color"></span>
              {{ cat.name }} ({{ getCategoryCount(cat.id) }})
            </button>
          }
        </div>

        <!-- Components Table -->
        <app-glass-card>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Component</th>
                  <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Material</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Weight</th>
                  <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Weight</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (comp of filteredComponents(); track comp.id) {
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="px-5 py-4">
                      <div>
                        <p class="text-white font-medium">{{ comp.name }}</p>
                        @if (comp.properties && hasProperties(comp.properties)) {
                          <p class="text-xs text-slate-500 mt-1">
                            {{ formatProperties(comp.properties) }}
                          </p>
                        }
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      @if (getCategory(comp.category_id); as cat) {
                        <span
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          [style.backgroundColor]="cat.color + '20'"
                          [style.color]="cat.color"
                        >
                          {{ cat.name }}
                        </span>
                      }
                    </td>
                    <td class="px-5 py-4">
                      <select
                        [ngModel]="comp.material_id"
                        (ngModelChange)="updateMaterial(comp.id, $event)"
                        class="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="">Select...</option>
                        @for (mat of materials; track mat.id) {
                          <option [value]="mat.id">{{ mat.name }}</option>
                        }
                      </select>
                    </td>
                    <td class="px-5 py-4 text-center">
                      <input
                        type="number"
                        min="1"
                        [ngModel]="comp.quantity"
                        (ngModelChange)="updateQuantity(comp.id, $event)"
                        class="w-16 bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-purple-500/50"
                      />
                    </td>
                    <td class="px-5 py-4 text-right">
                      <span [class]="comp.is_weight_calculated ? 'text-cyan-400' : 'text-white'" class="text-sm">
                        {{ supabase.formatWeight(comp.weight_per_unit_kg) }}
                      </span>
                      @if (comp.is_weight_calculated) {
                        <span class="ml-1.5 text-xs text-cyan-500" title="Auto-calculated">⚡</span>
                      }
                    </td>
                    <td class="px-5 py-4 text-right">
                      <span class="text-white font-semibold">
                        {{ supabase.formatWeight(getTotalWeight(comp)) }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-center">
                      <button
                        (click)="deleteComponent(comp.id)"
                        class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
                @if (filteredComponents().length === 0) {
                  <tr>
                    <td colspan="7" class="px-5 py-12 text-center text-slate-500">
                      <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                      <p>No components yet</p>
                      <p class="text-sm mt-1">Click "Add Component" to get started</p>
                    </td>
                  </tr>
                }
              </tbody>
              @if (filteredComponents().length > 0) {
                <tfoot>
                  <tr class="border-t border-white/10 bg-white/5">
                    <td colspan="5" class="px-5 py-4 text-right text-sm text-slate-400 font-medium">
                      Total for {{ activeCategory() === 'all' ? 'all categories' : getCategory(activeCategory())?.name }}:
                    </td>
                    <td class="px-5 py-4 text-right">
                      <span class="text-white font-bold text-lg">
                        {{ supabase.formatWeight(filteredWeight()) }}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              }
            </table>
          </div>
        </app-glass-card>

        <!-- Add Component Modal -->
        <app-modal
          [isOpen]="isAddingComponent()"
          title="Add Component"
          size="lg"
          (closeModal)="isAddingComponent.set(false)"
        >
          <div class="space-y-6">
            <!-- Basic Info -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Component Name</label>
                <input
                  type="text"
                  [(ngModel)]="newComponent.name"
                  placeholder="e.g., Drive Rail Left"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Category</label>
                <select
                  [(ngModel)]="newComponent.category_id"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Select category...</option>
                  @for (cat of categories; track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Profile & Material Selection -->
            <div class="p-4 rounded-xl bg-slate-800/50 space-y-4">
              <h4 class="text-sm font-semibold text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Auto-Calculate Weight
              </h4>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Profile Type</label>
                  <select
                    [(ngModel)]="newComponent.profile_type_id"
                    (ngModelChange)="onProfileChange()"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="">Select profile...</option>
                    @for (profile of activeProfiles(); track profile.id) {
                      <option [value]="profile.id">{{ profile.name }}</option>
                    }
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Material</label>
                  <select
                    [(ngModel)]="newComponent.material_id"
                    (ngModelChange)="recalculateWeight()"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="">Select material...</option>
                    @for (mat of materials; track mat.id) {
                      <option [value]="mat.id">{{ mat.name }} ({{ mat.density_kg_m3 }} kg/m³)</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Dynamic property inputs based on selected profile -->
              @if (selectedProfile()) {
                <div class="grid grid-cols-3 gap-4 pt-2">
                  @for (input of profileInputs(); track input.key) {
                    <div class="space-y-1.5">
                      <label class="block text-xs font-medium text-slate-400">{{ input.label }}</label>
                      <div class="relative">
                        <input
                          type="number"
                          [step]="input.step || 0.1"
                          [ngModel]="newComponent.properties[input.key]"
                          (ngModelChange)="updateProperty(input.key, $event)"
                          [placeholder]="input.default?.toString() || ''"
                          class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 pr-12"
                        />
                        @if (input.key.includes('mm')) {
                          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">mm</span>
                        }
                        @if (input.key.includes('kg')) {
                          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- OR Fastener Selection -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-white/10"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="px-4 bg-slate-900 text-xs text-slate-500 uppercase tracking-wider">or select fastener</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Fastener from Catalog</label>
              <select
                [(ngModel)]="newComponent.fastener_id"
                (ngModelChange)="onFastenerChange()"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Search fasteners...</option>
                @for (f of activeFasteners(); track f.id) {
                  <option [value]="f.id">{{ f.name }} ({{ supabase.formatWeight(f.weight_per_unit_kg, 'g') }}/ea)</option>
                }
              </select>
            </div>

            <!-- Manual Weight -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Quantity</label>
                <input
                  type="number"
                  min="1"
                  [(ngModel)]="newComponent.quantity"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Weight per Unit</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.0001"
                    [(ngModel)]="newComponent.weight_per_unit_kg"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
                </div>
              </div>
            </div>

            <!-- Preview -->
            @if (newComponent.weight_per_unit_kg && newComponent.quantity) {
              <app-glass-card [glow]="true">
                <div class="p-4 flex items-center justify-between">
                  <span class="text-sm text-slate-400">Total Weight Preview</span>
                  <span class="text-2xl font-bold text-white">
                    {{ supabase.formatWeight(previewWeight()) }}
                  </span>
                </div>
              </app-glass-card>
            }

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
              <app-button variant="ghost" (click)="isAddingComponent.set(false)">Cancel</app-button>
              <app-button
                variant="primary"
                icon="plus"
                (click)="saveComponent()"
                [disabled]="!newComponent.name || !newComponent.category_id"
              >
                Add Component
              </app-button>
            </div>
          </div>
        </app-modal>
      </div>
    }
  `
})
export class SubsystemViewComponent {
  @Input() subsystem: Subsystem | null = null;
  @Input() components: ComponentModel[] = [];
  @Input() categories: ComponentCategory[] = [];
  @Input() materials: Material[] = [];
  @Input() profiles: ProfileType[] = [];
  @Input() fasteners: Fastener[] = [];

  supabase = inject(SupabaseService);

  activeCategory = signal('all');
  isAddingComponent = signal(false);

  newComponent: NewComponent = this.getEmptyComponent();

  // Computed signals
  filteredComponents = computed(() => {
    const cat = this.activeCategory();
    if (cat === 'all') return this.components;
    return this.components.filter(c => c.category_id === cat);
  });

  subsystemWeight = computed(() => {
    return this.components.reduce((sum, c) => sum + (parseFloat(c.weight_per_unit_kg as any) || 0) * c.quantity, 0);
  });

  budgetPercent = computed(() => {
    if (!this.subsystem?.weight_budget_kg) return 0;
    return (this.subsystemWeight() / this.subsystem.weight_budget_kg) * 100;
  });

  filteredWeight = computed(() => {
    return this.filteredComponents().reduce((sum, c) => sum + (parseFloat(c.weight_per_unit_kg as any) || 0) * c.quantity, 0);
  });

  selectedProfile = computed(() => {
    return this.profiles.find(p => p.id === this.newComponent.profile_type_id) || null;
  });

  profileInputs = computed(() => {
    const profile = this.selectedProfile();
    if (!profile) return [];
    return this.supabase.getProfileInputs(profile);
  });

  activeProfiles = computed(() => {
    return this.profiles.filter(p => p.is_active);
  });

  activeFasteners = computed(() => {
    return this.fasteners.filter(f => f.is_active);
  });

  getEmptyComponent(): NewComponent {
    return {
      name: '',
      category_id: '',
      profile_type_id: '',
      material_id: '',
      fastener_id: '',
      quantity: 1,
      weight_per_unit_kg: '',
      properties: {},
      notes: ''
    };
  }

  getCategoryButtonClass(catId: string): string {
    const base = 'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2';
    if (this.activeCategory() === catId) {
      return `${base} bg-gradient-to-r from-purple-500 to-violet-600 text-white`;
    }
    return `${base} bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white`;
  }

  getCategoryCount(catId: string): number {
    return this.components.filter(c => c.category_id === catId).length;
  }

  getCategory(catId: string | undefined): ComponentCategory | undefined {
    return this.categories.find(c => c.id === catId);
  }

  hasProperties(props: Record<string, any>): boolean {
    return props && Object.keys(props).length > 0;
  }

  formatProperties(props: Record<string, any>): string {
    return Object.entries(props).map(([k, v]) => `${k}: ${v}`).join(' • ');
  }

  getTotalWeight(comp: ComponentModel): number {
    return (parseFloat(comp.weight_per_unit_kg as any) || 0) * comp.quantity;
  }

  previewWeight(): number {
    return parseFloat(this.newComponent.weight_per_unit_kg) * this.newComponent.quantity;
  }

  onProfileChange(): void {
    this.newComponent.properties = {};
    this.recalculateWeight();
  }

  onFastenerChange(): void {
    const fastener = this.fasteners.find(f => f.id === this.newComponent.fastener_id);
    if (fastener) {
      this.newComponent.weight_per_unit_kg = fastener.weight_per_unit_kg.toString();
      if (!this.newComponent.name) {
        this.newComponent.name = fastener.name;
      }
    }
  }

  updateProperty(key: string, value: any): void {
    this.newComponent.properties[key] = value;
    this.recalculateWeight();
  }

  recalculateWeight(): void {
    const profile = this.selectedProfile();
    if (profile && profile.calculation_method !== 'fixed') {
      const material = this.materials.find(m => m.id === this.newComponent.material_id);
      const weight = this.supabase.calculateComponentWeight(profile, material || null, this.newComponent.properties);
      if (weight !== null) {
        this.newComponent.weight_per_unit_kg = weight.toFixed(8);
      }
    }
  }

  async updateMaterial(componentId: string, materialId: string): Promise<void> {
    await this.supabase.updateComponent(componentId, { material_id: materialId || undefined });
  }

  async updateQuantity(componentId: string, quantity: number): Promise<void> {
    await this.supabase.updateComponent(componentId, { quantity: quantity || 1 });
  }

  async deleteComponent(componentId: string): Promise<void> {
    await this.supabase.deleteComponent(componentId);
  }

  async saveComponent(): Promise<void> {
    if (!this.newComponent.name || !this.newComponent.category_id || !this.subsystem) return;

    const profile = this.selectedProfile();

    const componentData: Partial<ComponentModel> = {
      subsystem_id: this.subsystem.id,
      category_id: this.newComponent.category_id,
      name: this.newComponent.name,
      profile_type_id: this.newComponent.profile_type_id || undefined,
      material_id: this.newComponent.material_id || undefined,
      fastener_id: this.newComponent.fastener_id || undefined,
      quantity: this.newComponent.quantity || 1,
      weight_per_unit_kg: parseFloat(this.newComponent.weight_per_unit_kg) || undefined,
      is_weight_calculated: !!profile && profile.calculation_method !== 'fixed',
      properties: this.newComponent.properties,
      notes: this.newComponent.notes
    };

    const success = await this.supabase.addComponent(componentData);
    if (success) {
      this.isAddingComponent.set(false);
      this.newComponent = this.getEmptyComponent();
    }
  }

  refresh(): void {
    if (this.subsystem) {
      this.supabase.fetchSubsystemComponents(this.subsystem.id);
      this.supabase.fetchAllData();
    }
  }
}
