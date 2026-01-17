import { Component, Input, Output, EventEmitter, inject, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import {
  Subsystem, Component as ComponentModel, ComponentCategory,
  Material, ProfileType, Fastener, NewComponent
} from '../../models';
import { GlassCardComponent, StatCardComponent, ButtonComponent, ModalComponent } from '../shared';

// Tipos de componente para el modal
type ComponentType = 'profile' | 'fastener' | 'cots' | 'custom';

interface ComponentTypeOption {
  value: ComponentType;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-subsystem-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, GlassCardComponent, StatCardComponent, ButtonComponent, ModalComponent],
  template: `
    @if (subsystem) {
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full max-w-full box-border">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 lg:mb-8">
          <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div
              class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              [style.backgroundColor]="subsystem.color + '20'"
            >
              <div
                class="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                [style.backgroundColor]="subsystem.color"
                [style.boxShadow]="'0 0 16px ' + subsystem.color"
              ></div>
            </div>
            <div class="min-w-0 flex-1">
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{{ subsystem.name }}</h1>
              @if (subsystem.description) {
                <p class="text-slate-400 mt-1 text-sm sm:text-base truncate">{{ subsystem.description }}</p>
              }
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <app-button variant="secondary" icon="refresh" (click)="refresh()">
              <span class="hidden sm:inline">Refresh</span>
            </app-button>
            <app-button variant="primary" icon="plus" (click)="openAddModal()">
              <span class="hidden sm:inline">Add Component</span>
              <span class="sm:hidden">Add</span>
            </app-button>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <app-stat-card
            title="Total Weight"
            [value]="supabase.formatWeight(subsystemWeight())"
            icon="scale"
            color="purple"
          />
          <app-stat-card
            title="Components"
            [value]="totalComponentCount().toString()"
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
        <div class="flex flex-wrap gap-2 mb-4 lg:mb-6">
          <button
            (click)="activeCategory.set('all')"
            [class]="activeCategory() === 'all'
              ? 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-colors'"
          >
            All
          </button>
          @for (cat of categories; track cat.id) {
            <button
              (click)="activeCategory.set(cat.id)"
              [class]="activeCategory() === cat.id
                ? 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-colors'"
            >
              {{ cat.name }}
            </button>
          }
        </div>

        <!-- Components Table -->
        <app-glass-card>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px]">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="px-3 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th class="px-3 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Category</th>
                  <th class="px-3 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Material</th>
                  <th class="px-3 sm:px-5 py-3 sm:py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th class="px-3 sm:px-5 py-3 sm:py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Wt</th>
                  <th class="px-3 sm:px-5 py-3 sm:py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                  <th class="px-3 sm:px-5 py-3 sm:py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (comp of filteredComponents(); track comp.id) {
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="px-3 sm:px-5 py-3 sm:py-4">
                      <div class="font-medium text-white text-sm truncate max-w-[150px] sm:max-w-none">{{ comp.name }}</div>
                      @if (comp.notes) {
                        <div class="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-none">{{ comp.notes }}</div>
                      }
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 hidden lg:table-cell">
                      <span class="text-slate-400 text-sm">{{ getCategory(comp.category_id)?.name || '—' }}</span>
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 hidden lg:table-cell">
                      <span class="text-slate-400 text-sm">{{ getMaterial(comp.material_id)?.name || '—' }}</span>
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 text-center">
                      <input
                        type="number"
                        [value]="comp.quantity"
                        (change)="updateQuantity(comp.id, $any($event.target).valueAsNumber)"
                        min="1"
                        class="w-12 sm:w-16 bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1 text-center text-white text-sm focus:outline-none focus:border-purple-500/50"
                      />
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 text-right">
                      <span [class]="comp.is_weight_calculated ? 'text-cyan-400' : 'text-white'" class="text-sm">
                        {{ supabase.formatWeight(comp.weight_per_unit_kg) }}
                      </span>
                      @if (comp.is_weight_calculated) {
                        <span class="ml-1 text-xs text-cyan-500" title="Auto-calculated">⚡</span>
                      }
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 text-right">
                      <span class="text-white font-semibold text-xs sm:text-sm">
                        {{ supabase.formatWeight(getTotalWeight(comp)) }}
                      </span>
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 text-center">
                      <button
                        (click)="deleteComponent(comp.id)"
                        class="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
                    <td colspan="5" class="px-3 sm:px-5 py-3 sm:py-4 text-right text-xs sm:text-sm text-slate-400 font-medium hidden lg:table-cell">
                      Total for {{ activeCategory() === 'all' ? 'all categories' : getCategory(activeCategory())?.name }}:
                    </td>
                    <td colspan="3" class="px-3 sm:px-5 py-3 sm:py-4 text-right text-xs sm:text-sm text-slate-400 font-medium lg:hidden">
                      Total:
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 text-right">
                      <span class="text-white font-bold text-sm sm:text-lg">
                        {{ supabase.formatWeight(filteredWeight()) }}
                      </span>
                    </td>
                    <td class="hidden lg:table-cell"></td>
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
          (closeModal)="closeAddModal()"
        >
          <div class="space-y-4 sm:space-y-6">
            <!-- Component Type Selector -->
            <div class="space-y-3">
              <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Component Type</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                @for (type of componentTypes; track type.value) {
                  <button
                    (click)="selectComponentType(type.value)"
                    [class]="getTypeButtonClass(type.value)"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                        @switch (type.icon) {
                          @case ('profile') {
                            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"></path>
                            </svg>
                          }
                          @case ('fastener') {
                            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                          }
                          @case ('cots') {
                            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                            </svg>
                          }
                          @case ('custom') {
                            <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
                            </svg>
                          }
                        }
                      </div>
                      <div class="text-left min-w-0">
                        <p class="font-medium text-white text-sm sm:text-base">{{ type.label }}</p>
                        <p class="text-xs text-slate-400 truncate">{{ type.description }}</p>
                      </div>
                    </div>
                  </button>
                }
              </div>
            </div>

            <!-- Profile Form -->
            @if (selectedComponentType() === 'profile') {
              <div class="space-y-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                <h4 class="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"></path>
                  </svg>
                  Structural Profile
                </h4>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Component Name</label>
                  <input
                    type="text"
                    [(ngModel)]="newComponent.name"
                    placeholder="e.g., Drive Rail Left"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Profile Type</label>
                    <select
                      [(ngModel)]="newComponent.profile_type_id"
                      (ngModelChange)="onProfileChange()"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
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
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="">Select material...</option>
                      @for (mat of materials; track mat.id) {
                        <option [value]="mat.id">{{ mat.name }} ({{ formatDensity(mat.density_kg_m3) }})</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Length input - with unit conversion -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Length</label>
                    <div class="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        [ngModel]="lengthInputValue()"
                        (ngModelChange)="updateLengthInput($event)"
                        placeholder="0"
                        class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 pr-12"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ getLengthUnit() }}</span>
                    </div>
                    @if (lengthInMm() && isImperial()) {
                      <span class="text-xs text-slate-500">{{ lengthInMm() | number:'1.1-1' }} mm</span>
                    }
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="newComponent.quantity"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Calculated Weight</label>
                    <div class="relative">
                      <input
                        type="text"
                        [value]="getCalculatedWeightDisplay()"
                        readonly
                        class="w-full bg-slate-900/50 border border-white/5 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-cyan-400 pr-12 cursor-not-allowed"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ getWeightUnit() }}</span>
                    </div>
                  </div>
                </div>

                <!-- Additional profile-specific inputs (CORRECTED) -->
                @if (currentProfile() && hasAdditionalInputs()) {
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-white/5">
                    @for (input of additionalProfileInputs(); track input.key) {
                      <div class="space-y-1.5">
                        <label class="block text-xs font-medium text-slate-400">{{ input.label }}</label>
                        <div class="relative">
                          <input
                            type="number"
                            [step]="input.step || 0.1"
                            [ngModel]="getPropertyDisplayValue(input.key)"
                            (ngModelChange)="updateProperty(input.key, $event)"
                            placeholder="0"
                            class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 pr-12"
                          />
                          @if (input.unit) {
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ input.unit }}</span>
                          }
                        </div>
                        <!-- Show mm conversion when in imperial mode for length properties -->
                        @if (isImperial() && input.key.includes('_mm') && newComponent.properties[input.key]) {
                          <span class="text-xs text-slate-500">{{ newComponent.properties[input.key] | number:'1.1-1' }} mm</span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Fastener Form -->
            @if (selectedComponentType() === 'fastener') {
              <div class="space-y-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                <h4 class="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Fastener
                </h4>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Fastener Type</label>
                  <select
                    [(ngModel)]="newComponent.fastener_id"
                    (ngModelChange)="onFastenerChange()"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Select fastener...</option>
                    @for (fastener of activeFasteners(); track fastener.id) {
                      <option [value]="fastener.id">{{ fastener.name }} ({{ supabase.formatWeight(fastener.weight_per_unit_kg, 'g') }}/ea)</option>
                    }
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="newComponent.quantity"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Weight per Unit</label>
                    <div class="relative">
                      <input
                        type="text"
                        [value]="newComponent.weight_per_unit_kg ? supabase.formatWeight(parseFloat(newComponent.weight_per_unit_kg), 'g') : '—'"
                        readonly
                        class="w-full bg-slate-900/50 border border-white/5 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-amber-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- COTS Form -->
            @if (selectedComponentType() === 'cots') {
              <div class="space-y-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                <h4 class="text-sm font-semibold text-blue-400 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                  Commercial Off-The-Shelf (COTS)
                </h4>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Component Name</label>
                  <input
                    type="text"
                    [(ngModel)]="newComponent.name"
                    placeholder="e.g., NEO Motor"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Part Number / SKU</label>
                    <input
                      type="text"
                      [(ngModel)]="newComponent.part_number"
                      placeholder="e.g., REV-21-1650"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Supplier</label>
                    <input
                      type="text"
                      [(ngModel)]="newComponent.supplier"
                      placeholder="e.g., REV Robotics"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Category</label>
                  <select
                    [(ngModel)]="newComponent.category_id"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="">Select category...</option>
                    @for (cat of cotsCategories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="newComponent.quantity"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Weight per Unit</label>
                    <div class="relative">
                      <input
                        type="number"
                        step="0.0001"
                        [ngModel]="weightInputValue()"
                        (ngModelChange)="updateWeightInput($event)"
                        placeholder="0.0000"
                        class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 pr-12"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ getWeightUnit() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Custom Part Form -->
            @if (selectedComponentType() === 'custom') {
              <div class="space-y-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                <h4 class="text-sm font-semibold text-orange-400 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
                  </svg>
                  Custom Part
                </h4>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Component Name</label>
                  <input
                    type="text"
                    [(ngModel)]="newComponent.name"
                    placeholder="e.g., Intake Roller Assembly"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Category</label>
                  <select
                    [(ngModel)]="newComponent.category_id"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="">Select category...</option>
                    @for (cat of customCategories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="newComponent.quantity"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Weight per Unit</label>
                    <div class="relative">
                      <input
                        type="number"
                        step="0.0001"
                        [ngModel]="weightInputValue()"
                        (ngModelChange)="updateWeightInput($event)"
                        placeholder="0.0000"
                        class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 pr-12"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ getWeightUnit() }}</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Notes (optional)</label>
                  <textarea
                    [(ngModel)]="newComponent.notes"
                    placeholder="Additional details about this part..."
                    rows="2"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none"
                  ></textarea>
                </div>
              </div>
            }

            <!-- Weight Preview -->
            @if (canShowWeightPreview()) {
              <div class="mt-4 sm:mt-6">
                <app-glass-card [glow]="true">
                  <div class="p-3 sm:p-4 flex items-center justify-between">
                    <span class="text-sm text-slate-400">Total Weight Preview</span>
                    <span class="text-xl sm:text-2xl font-bold text-white">
                      {{ supabase.formatWeight(previewWeight()) }}
                    </span>
                  </div>
                </app-glass-card>
              </div>
            }

            <!-- Actions -->
            <div class="flex justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10">
              <app-button variant="ghost" (click)="closeAddModal()">Cancel</app-button>
              <app-button
                variant="primary"
                icon="plus"
                (click)="saveComponent()"
                [disabled]="!canSaveComponent()"
              >
                <span class="hidden sm:inline">Add Component</span>
                <span class="sm:hidden">Add</span>
              </app-button>
            </div>
          </div>
        </app-modal>
      </div>
    }
  `
})
export class SubsystemViewComponent implements OnChanges {
  @Input() subsystem: Subsystem | null = null;
  @Input() components: ComponentModel[] = [];
  @Input() categories: ComponentCategory[] = [];
  @Input() materials: Material[] = [];
  @Input() profiles: ProfileType[] = [];
  @Input() fasteners: Fastener[] = [];

  @Output() componentsChange = new EventEmitter<void>();

  supabase = inject(SupabaseService);

  // Signals
  activeCategory = signal('all');
  isAddingComponent = signal(false);
  selectedComponentType = signal<ComponentType | null>(null);
  componentsLocal = signal<ComponentModel[]>([]);
  
  // Signal for length input to handle unit conversion properly
  lengthInputValue = signal<number | null>(null);
  
  // Signal for weight input in user units (lb or kg)
  weightInputValue = signal<number | null>(null);
  
  // Signal to track profile selection for reactivity
  currentProfileId = signal<string>('');

  // Component type options
  componentTypes: ComponentTypeOption[] = [
    { value: 'profile', label: 'Structural Profile', description: 'Tubing, angle, channel, etc.', icon: 'profile' },
    { value: 'fastener', label: 'Fastener', description: 'Bolts, nuts, screws from catalog', icon: 'fastener' },
    { value: 'cots', label: 'COTS Part', description: 'Commercial off-the-shelf', icon: 'cots' },
    { value: 'custom', label: 'Custom Part', description: 'Custom fabricated or other', icon: 'custom' }
  ];

  // Form state
  newComponent: NewComponent & { part_number?: string; supplier?: string } = this.getEmptyComponent();

  // Lifecycle
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subsystem'] && this.subsystem) {
      this.loadComponents();
    }
    if (changes['components']) {
      this.componentsLocal.set(this.components);
    }
  }

  async loadComponents(): Promise<void> {
    if (this.subsystem) {
      await this.supabase.fetchSubsystemComponents(this.subsystem.id);
      this.componentsLocal.set(this.supabase.components());
    }
  }

  // Computed signals
  filteredComponents = computed(() => {
    const cat = this.activeCategory();
    const comps = this.componentsLocal();
    if (cat === 'all') return comps;
    return comps.filter(c => c.category_id === cat);
  });

  subsystemWeight = computed(() => {
    return this.componentsLocal().reduce((sum, c) => sum + (parseFloat(c.weight_per_unit_kg as any) || 0) * c.quantity, 0);
  });

  totalComponentCount = computed(() => {
    return this.componentsLocal().reduce((sum, c) => sum + (c.quantity || 1), 0);
  });

  budgetPercent = computed(() => {
    if (!this.subsystem?.weight_budget_kg) return 0;
    return (this.subsystemWeight() / this.subsystem.weight_budget_kg) * 100;
  });

  filteredWeight = computed(() => {
    return this.filteredComponents().reduce((sum, c) => sum + (parseFloat(c.weight_per_unit_kg as any) || 0) * c.quantity, 0);
  });

  // Computed that depends on signal for reactivity
  currentProfile = computed(() => {
    const id = this.currentProfileId();
    return this.profiles.find(p => p.id === id) || null;
  });

  // Computed for length in mm (for display of conversion)
  lengthInMm = computed(() => {
    const value = this.lengthInputValue();
    if (value === null || value <= 0) return null;
    
    if (this.isImperial()) {
      return this.supabase.inToMm(value);
    }
    return value;
  });

  selectedFastener = computed(() => {
    return this.fasteners.find(f => f.id === this.newComponent.fastener_id) || null;
  });

  activeProfiles = computed(() => {
    return this.profiles.filter(p => p.is_active);
  });

  activeFasteners = computed(() => {
    return this.fasteners.filter(f => f.is_active);
  });

  cotsCategories = computed(() => {
    const allowedSlugs = ['electronics', 'hardware', 'pneumatics', 'cots'];
    return this.categories.filter(c => allowedSlugs.includes(c.slug?.toLowerCase() || ''));
  });

  customCategories = computed(() => {
    const excludedSlugs = ['fasteners'];
    return this.categories.filter(c => !excludedSlugs.includes(c.slug?.toLowerCase() || ''));
  });

  // CORRECTED: additionalProfileInputs now respects global units
  additionalProfileInputs = computed(() => {
    const profile = this.currentProfile();
    if (!profile) return [];

    const inputs = this.supabase.getProfileInputs(profile);
    const isImperial = this.isImperial();
    
    return inputs
      .filter(i => i.key !== 'length_mm')
      .map(i => {
        // Determine correct unit based on global unit system
        let unit = '';
        if (i.key.includes('_mm')) {
          unit = isImperial ? 'in' : 'mm';
        } else if (i.key.includes('_kg')) {
          unit = isImperial ? 'lb' : 'kg';
        }
        
        return {
          ...i,
          unit,
          // Flag to know if conversion is needed
          needsConversion: i.key.includes('_mm') || i.key.includes('_kg')
        };
      });
  });

  // Helper methods
  isImperial(): boolean {
    return this.supabase.project()?.unit_system === 'imperial';
  }

  getLengthUnit(): string {
    return this.isImperial() ? 'in' : 'mm';
  }

  getWeightUnit(): string {
    return this.isImperial() ? 'lb' : 'kg';
  }

  formatDensity(densityKgM3: number): string {
    if (this.isImperial()) {
      // Convert kg/m³ to lb/in³
      const lbPerIn3 = densityKgM3 * 0.0000361273;
      return `${lbPerIn3.toFixed(6)} lb/in³`;
    }
    return `${densityKgM3} kg/m³`;
  }

  getCalculatedWeightDisplay(): string {
    const weight = parseFloat(this.newComponent.weight_per_unit_kg);
    if (!weight || weight <= 0) return '—';
    
    if (this.isImperial()) {
      return this.supabase.kgToLb(weight).toFixed(4);
    }
    return weight.toFixed(6);
  }

  hasAdditionalInputs(): boolean {
    return this.additionalProfileInputs().length > 0;
  }

  // NEW: Get display value for additional property inputs (converts from internal mm/kg to user units)
  getPropertyDisplayValue(key: string): number | null {
    const internalValue = this.newComponent.properties[key];
    if (internalValue === undefined || internalValue === null) return null;
    
    const numValue = parseFloat(internalValue) || 0;
    if (numValue <= 0) return null;
    
    // Convert from internal units to user units
    if (key.includes('_mm')) {
      if (this.isImperial()) {
        return parseFloat(this.supabase.mmToIn(numValue).toFixed(4));
      }
      return numValue;
    } else if (key.includes('_kg')) {
      if (this.isImperial()) {
        return parseFloat(this.supabase.kgToLb(numValue).toFixed(4));
      }
      return numValue;
    }
    
    return numValue;
  }

  getEmptyComponent(): NewComponent & { part_number?: string; supplier?: string } {
    return {
      name: '',
      category_id: '',
      profile_type_id: '',
      material_id: '',
      fastener_id: '',
      quantity: 1,
      weight_per_unit_kg: '',
      properties: {},
      notes: '',
      part_number: '',
      supplier: ''
    };
  }

  getCategory(id: string | undefined): ComponentCategory | undefined {
    if (!id) return undefined;
    return this.categories.find(c => c.id === id);
  }

  getMaterial(id: string | undefined): Material | undefined {
    if (!id) return undefined;
    return this.materials.find(m => m.id === id);
  }

  getTotalWeight(comp: ComponentModel): number {
    return (parseFloat(comp.weight_per_unit_kg as any) || 0) * comp.quantity;
  }

  // Modal methods
  openAddModal(): void {
    this.newComponent = this.getEmptyComponent();
    this.selectedComponentType.set(null);
    this.lengthInputValue.set(null);
    this.weightInputValue.set(null);
    this.currentProfileId.set('');
    this.isAddingComponent.set(true);
  }

  closeAddModal(): void {
    this.isAddingComponent.set(false);
    this.selectedComponentType.set(null);
    this.lengthInputValue.set(null);
    this.weightInputValue.set(null);
    this.currentProfileId.set('');
    this.newComponent = this.getEmptyComponent();
  }

  selectComponentType(type: ComponentType): void {
    this.selectedComponentType.set(type);
    this.newComponent = this.getEmptyComponent();
    this.lengthInputValue.set(null);
    this.weightInputValue.set(null);
    this.currentProfileId.set('');

    switch (type) {
      case 'profile':
        const structureCategory = this.categories.find(c => c.slug?.toLowerCase() === 'structure');
        if (structureCategory) {
          this.newComponent.category_id = structureCategory.id;
        }
        break;
      case 'fastener':
        const fastenerCategory = this.categories.find(c => c.slug?.toLowerCase() === 'fasteners');
        if (fastenerCategory) {
          this.newComponent.category_id = fastenerCategory.id;
        }
        break;
    }
  }

  getTypeButtonClass(type: ComponentType): string {
    const base = 'p-3 sm:p-4 rounded-xl border transition-all text-left w-full';
    if (this.selectedComponentType() === type) {
      switch (type) {
        case 'profile':
          return `${base} bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-500/30`;
        case 'fastener':
          return `${base} bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-500/30`;
        case 'cots':
          return `${base} bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30`;
        case 'custom':
          return `${base} bg-orange-500/20 border-orange-500/50 ring-2 ring-orange-500/30`;
      }
    }
    return `${base} bg-slate-800/50 border-white/10 hover:bg-slate-800 hover:border-white/20`;
  }

  // Handle length input with unit conversion
  updateLengthInput(valueInUserUnits: number | string): void {
    const numValue = parseFloat(valueInUserUnits as string) || 0;
    this.lengthInputValue.set(numValue > 0 ? numValue : null);
    
    // Convert to mm for internal calculation
    let lengthMm: number;
    if (this.isImperial()) {
      lengthMm = this.supabase.inToMm(numValue);
    } else {
      lengthMm = numValue;
    }
    
    this.newComponent.properties['length_mm'] = lengthMm > 0 ? lengthMm : undefined;
    this.recalculateWeight();
  }

  // Handle weight input with unit conversion for COTS/Custom parts
  updateWeightInput(valueInUserUnits: number | string): void {
    const numValue = parseFloat(valueInUserUnits as string) || 0;
    this.weightInputValue.set(numValue > 0 ? numValue : null);
    
    // Convert to kg for internal storage
    let weightKg: number;
    if (this.isImperial()) {
      weightKg = this.supabase.lbToKg(numValue);
    } else {
      weightKg = numValue;
    }
    
    this.newComponent.weight_per_unit_kg = weightKg > 0 ? weightKg.toFixed(8) : '';
  }

  // CORRECTED: updateProperty now handles unit conversion
  updateProperty(key: string, value: any): void {
    const numValue = parseFloat(value) || 0;
    
    // Convert to internal units (mm for lengths, kg for weights)
    let convertedValue: number;
    
    if (key.includes('_mm')) {
      // It's a length measurement
      if (this.isImperial()) {
        convertedValue = this.supabase.inToMm(numValue);
      } else {
        convertedValue = numValue;
      }
    } else if (key.includes('_kg')) {
      // It's a weight
      if (this.isImperial()) {
        convertedValue = this.supabase.lbToKg(numValue);
      } else {
        convertedValue = numValue;
      }
    } else {
      // No conversion needed
      convertedValue = numValue;
    }
    
    // Only save if value is greater than 0
    this.newComponent.properties[key] = convertedValue > 0 ? convertedValue : undefined;
    this.recalculateWeight();
  }

  onProfileChange(): void {
    this.newComponent.properties = {};
    this.lengthInputValue.set(null);
    
    // Update the signal for reactivity
    this.currentProfileId.set(this.newComponent.profile_type_id || '');
    
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

  recalculateWeight(): void {
    // Get profile directly from array (not from computed) to ensure latest selection
    const profile = this.profiles.find(p => p.id === this.newComponent.profile_type_id);
    
    if (!profile) {
      this.newComponent.weight_per_unit_kg = '';
      return;
    }
    
    if (profile.calculation_method === 'fixed') {
      return;
    }
    
    const material = this.materials.find(m => m.id === this.newComponent.material_id);
    
    const weight = this.supabase.calculateComponentWeight(
      profile, 
      material || null, 
      this.newComponent.properties
    );
    
    if (weight !== null && weight > 0) {
      this.newComponent.weight_per_unit_kg = weight.toFixed(8);
    } else {
      this.newComponent.weight_per_unit_kg = '';
    }
  }

  canShowWeightPreview(): boolean {
    const type = this.selectedComponentType();
    if (!type) return false;

    const weight = parseFloat(this.newComponent.weight_per_unit_kg);
    return weight > 0 && this.newComponent.quantity > 0;
  }

  previewWeight(): number {
    return parseFloat(this.newComponent.weight_per_unit_kg) * this.newComponent.quantity;
  }

  canSaveComponent(): boolean {
    const type = this.selectedComponentType();
    if (!type) return false;

    switch (type) {
      case 'profile':
        return !!(
          this.newComponent.name &&
          this.newComponent.profile_type_id &&
          this.newComponent.material_id &&
          this.newComponent.properties['length_mm'] &&
          parseFloat(this.newComponent.weight_per_unit_kg) > 0
        );
      case 'fastener':
        return !!(
          this.newComponent.fastener_id &&
          this.newComponent.quantity > 0
        );
      case 'cots':
        return !!(
          this.newComponent.name &&
          this.newComponent.category_id &&
          parseFloat(this.newComponent.weight_per_unit_kg) > 0
        );
      case 'custom':
        return !!(
          this.newComponent.name &&
          this.newComponent.category_id &&
          parseFloat(this.newComponent.weight_per_unit_kg) > 0
        );
      default:
        return false;
    }
  }

  async updateMaterial(componentId: string, materialId: string): Promise<void> {
    await this.supabase.updateComponent(componentId, { material_id: materialId || undefined });
    await this.loadComponents();
  }

  async updateQuantity(componentId: string, quantity: number): Promise<void> {
    await this.supabase.updateComponent(componentId, { quantity: quantity || 1 });
    await this.loadComponents();
  }

  async deleteComponent(componentId: string): Promise<void> {
    await this.supabase.deleteComponent(componentId);
    await this.loadComponents();
  }

  async saveComponent(): Promise<void> {
    if (!this.canSaveComponent() || !this.subsystem) return;

    const type = this.selectedComponentType();
    const profile = this.profiles.find(p => p.id === this.newComponent.profile_type_id);

    const componentData: Partial<ComponentModel> = {
      subsystem_id: this.subsystem.id,
      name: this.newComponent.name,
      quantity: this.newComponent.quantity || 1,
      weight_per_unit_kg: parseFloat(this.newComponent.weight_per_unit_kg) || undefined,
      notes: this.newComponent.notes
    };

    switch (type) {
      case 'profile':
        componentData.category_id = this.newComponent.category_id;
        componentData.profile_type_id = this.newComponent.profile_type_id;
        componentData.material_id = this.newComponent.material_id;
        componentData.is_weight_calculated = true;
        componentData.properties = this.newComponent.properties;
        break;

      case 'fastener':
        componentData.category_id = this.newComponent.category_id;
        componentData.fastener_id = this.newComponent.fastener_id;
        componentData.is_weight_calculated = false;
        break;

      case 'cots':
        componentData.category_id = this.newComponent.category_id;
        componentData.part_number = this.newComponent.part_number;
        componentData.supplier = this.newComponent.supplier;
        componentData.is_weight_calculated = false;
        break;

      case 'custom':
        componentData.category_id = this.newComponent.category_id;
        componentData.is_weight_calculated = false;
        break;
    }

    const success = await this.supabase.addComponent(componentData);
    if (success) {
      this.closeAddModal();
      await this.loadComponents();
      this.componentsChange.emit();
    }
  }

  async refresh(): Promise<void> {
    if (this.subsystem) {
      await this.loadComponents();
      await this.supabase.fetchAllData();
    }
  }

  // Helper for template
  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }
}
