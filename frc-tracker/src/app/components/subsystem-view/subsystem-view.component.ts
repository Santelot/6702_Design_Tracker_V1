import { Component, Input, Output, EventEmitter, inject, signal, computed, effect, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule, GlassCardComponent, StatCardComponent, ButtonComponent, ModalComponent],
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
            [value]="componentsLocal().length.toString()"
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
        <div class="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          <button
            (click)="activeCategory.set('all')"
            [class]="getCategoryButtonClass('all')"
          >
            All ({{ componentsLocal().length }})
          </button>
          @for (cat of categories; track cat.id) {
            <button
              (click)="activeCategory.set(cat.id)"
              [class]="getCategoryButtonClass(cat.id)"
            >
              <span class="w-2 h-2 rounded-full flex-shrink-0" [style.backgroundColor]="cat.color"></span>
              <span class="truncate">{{ cat.name }} ({{ getCategoryCount(cat.id) }})</span>
            </button>
          }
        </div>

        <!-- Components Table -->
        <app-glass-card>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[500px]">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-left px-3 sm:px-5 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Component</th>
                  <th class="text-left px-3 sm:px-5 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th class="text-left px-3 sm:px-5 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Material</th>
                  <th class="text-center px-3 sm:px-5 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th class="text-right px-3 sm:px-5 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Unit Weight</th>
                  <th class="text-right px-3 sm:px-5 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                  <th class="text-center px-3 sm:px-5 py-3 sm:py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-12 sm:w-16">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (comp of filteredComponents(); track comp.id) {
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="px-3 sm:px-5 py-3 sm:py-4">
                      <div class="min-w-0">
                        <p class="text-white font-medium truncate max-w-[150px] sm:max-w-none">{{ comp.name }}</p>
                        <!-- Show category on mobile -->
                        <div class="sm:hidden mt-1">
                          @if (getCategory(comp.category_id); as cat) {
                            <span
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                              [style.backgroundColor]="cat.color + '20'"
                              [style.color]="cat.color"
                            >
                              {{ cat.name }}
                            </span>
                          }
                        </div>
                        @if (comp.properties && hasProperties(comp.properties)) {
                          <p class="text-xs text-slate-500 mt-1 truncate max-w-[150px] sm:max-w-none">
                            {{ formatProperties(comp.properties) }}
                          </p>
                        }
                      </div>
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 hidden sm:table-cell">
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
                    <td class="px-3 sm:px-5 py-3 sm:py-4 hidden md:table-cell">
                      @if (comp.fastener_id) {
                        <span class="text-slate-400 text-sm">—</span>
                      } @else {
                        <select
                          [ngModel]="comp.material_id"
                          (ngModelChange)="updateMaterial(comp.id, $event)"
                          class="bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500/50 max-w-[100px] lg:max-w-[120px]"
                        >
                          <option value="">Select...</option>
                          @for (mat of materials; track mat.id) {
                            <option [value]="mat.id">{{ mat.name }}</option>
                          }
                        </select>
                      }
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 text-center">
                      <input
                        type="number"
                        min="1"
                        [ngModel]="comp.quantity"
                        (ngModelChange)="updateQuantity(comp.id, $event)"
                        class="w-12 sm:w-16 bg-slate-800/50 border border-white/10 rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm text-white text-center focus:outline-none focus:border-purple-500/50"
                      />
                    </td>
                    <td class="px-3 sm:px-5 py-3 sm:py-4 text-right hidden lg:table-cell">
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
                        <option [value]="mat.id">{{ mat.name }} ({{ mat.density_kg_m3 }} kg/m³)</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Length input - ALWAYS show for profiles -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Length</label>
                    <div class="relative">
                      <input
                        type="number"
                        step="0.1"
                        [ngModel]="newComponent.properties['length_mm']"
                        (ngModelChange)="updateProperty('length_mm', $event)"
                        placeholder="0"
                        class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 pr-12"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">mm</span>
                    </div>
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
                        [value]="newComponent.weight_per_unit_kg || '—'"
                        readonly
                        class="w-full bg-slate-900/50 border border-white/5 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-cyan-400 pr-12 cursor-not-allowed"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
                    </div>
                  </div>
                </div>

                <!-- Additional profile-specific inputs -->
                @if (selectedProfile() && hasAdditionalInputs()) {
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-white/5">
                    @for (input of additionalProfileInputs(); track input.key) {
                      <div class="space-y-1.5">
                        <label class="block text-xs font-medium text-slate-400">{{ input.label }}</label>
                        <div class="relative">
                          <input
                            type="number"
                            [step]="input.step || 0.1"
                            [ngModel]="newComponent.properties[input.key]"
                            (ngModelChange)="updateProperty(input.key, $event)"
                            [placeholder]="input.default?.toString() || ''"
                            class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 pr-12"
                          />
                          @if (input.unit) {
                            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ input.unit }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Fastener Form -->
            @if (selectedComponentType() === 'fastener') {
              <div class="space-y-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20">
                <h4 class="text-sm font-semibold text-rose-400 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Fastener from Catalog
                </h4>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-400">Select Fastener</label>
                  <select
                    [(ngModel)]="newComponent.fastener_id"
                    (ngModelChange)="onFastenerChange()"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="">Choose a fastener...</option>
                    @for (f of activeFasteners(); track f.id) {
                      <option [value]="f.id">{{ f.name }} ({{ supabase.formatWeight(f.weight_per_unit_kg, 'g') }}/ea)</option>
                    }
                  </select>
                </div>

                @if (selectedFastener()) {
                  <div class="p-3 rounded-lg bg-slate-800/50 text-sm">
                    <div class="grid grid-cols-2 gap-3 sm:gap-4 text-slate-300">
                      <div>
                        <span class="text-slate-500">Thread:</span>
                        {{ selectedFastener()?.thread_size }}
                      </div>
                      <div>
                        <span class="text-slate-500">Length:</span>
                        {{ supabase.formatLength(selectedFastener()?.length_mm) }}
                      </div>
                      <div>
                        <span class="text-slate-500">Head:</span>
                        {{ selectedFastener()?.head_type || '—' }}
                      </div>
                      <div>
                        <span class="text-slate-500">Material:</span>
                        {{ selectedFastener()?.material || '—' }}
                      </div>
                    </div>
                  </div>
                }

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="newComponent.quantity"
                      class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-400">Weight per Unit</label>
                    <div class="relative">
                      <input
                        type="text"
                        [value]="newComponent.weight_per_unit_kg || '—'"
                        readonly
                        class="w-full bg-slate-900/50 border border-white/5 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-cyan-400 pr-12 cursor-not-allowed"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
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
                        [(ngModel)]="newComponent.weight_per_unit_kg"
                        placeholder="0.0000"
                        class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 pr-12"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
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
                  Custom / Other Part
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
                        [(ngModel)]="newComponent.weight_per_unit_kg"
                        placeholder="0.0000"
                        class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 pr-12"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
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

            <!-- Weight Preview - Fixed padding -->
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

  // Component type options
  componentTypes: ComponentTypeOption[] = [
    { value: 'profile', label: 'Structural Profile', description: 'Tubing, angle, channel, etc.', icon: 'profile' },
    { value: 'fastener', label: 'Fastener', description: 'Bolts, nuts, screws from catalog', icon: 'fastener' },
    { value: 'cots', label: 'COTS Part', description: 'Commercial off-the-shelf', icon: 'cots' },
    { value: 'custom', label: 'Custom Part', description: 'Custom fabricated or other', icon: 'custom' }
  ];

  newComponent: NewComponent & { part_number?: string; supplier?: string } = this.getEmptyComponent();

  // Lifecycle - cargar componentes cuando cambia el subsystem
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

  selectedFastener = computed(() => {
    return this.fasteners.find(f => f.id === this.newComponent.fastener_id) || null;
  });

  activeProfiles = computed(() => {
    return this.profiles.filter(p => p.is_active);
  });

  activeFasteners = computed(() => {
    return this.fasteners.filter(f => f.is_active);
  });

  // Categories for COTS (electronics, hardware, pneumatics, COTS)
  cotsCategories = computed(() => {
    const allowedSlugs = ['electronics', 'hardware', 'pneumatics', 'cots'];
    return this.categories.filter(c => allowedSlugs.includes(c.slug?.toLowerCase() || ''));
  });

  // Categories for Custom parts (custom-parts, other, structure, hardware)
  customCategories = computed(() => {
    const excludedSlugs = ['fasteners']; // Fasteners have their own flow
    return this.categories.filter(c => !excludedSlugs.includes(c.slug?.toLowerCase() || ''));
  });

  // Additional profile inputs (beyond length)
  additionalProfileInputs = computed(() => {
    const profile = this.selectedProfile();
    if (!profile) return [];

    const inputs = this.supabase.getProfileInputs(profile);
    // Filter out length_mm since we already show it
    return inputs
      .filter(i => i.key !== 'length_mm')
      .map(i => ({
        ...i,
        unit: i.key.includes('mm') ? 'mm' : i.key.includes('kg') ? 'kg' : ''
      }));
  });

  hasAdditionalInputs(): boolean {
    return this.additionalProfileInputs().length > 0;
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

  openAddModal(): void {
    this.newComponent = this.getEmptyComponent();
    this.selectedComponentType.set(null);
    this.isAddingComponent.set(true);
  }

  closeAddModal(): void {
    this.isAddingComponent.set(false);
    this.selectedComponentType.set(null);
    this.newComponent = this.getEmptyComponent();
  }

  selectComponentType(type: ComponentType): void {
    this.selectedComponentType.set(type);
    this.newComponent = this.getEmptyComponent();

    // Auto-assign category based on type
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
      // COTS and Custom let user select category
    }
  }

  getTypeButtonClass(type: ComponentType): string {
    const base = 'p-3 sm:p-4 rounded-xl border transition-all text-left w-full';
    if (this.selectedComponentType() === type) {
      switch (type) {
        case 'profile':
          return `${base} bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30`;
        case 'fastener':
          return `${base} bg-rose-500/10 border-rose-500/50 ring-2 ring-rose-500/30`;
        case 'cots':
          return `${base} bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30`;
        case 'custom':
          return `${base} bg-orange-500/10 border-orange-500/50 ring-2 ring-orange-500/30`;
      }
    }
    return `${base} bg-slate-800/30 border-white/10 hover:bg-slate-800/50 hover:border-white/20`;
  }

  getCategoryButtonClass(catId: string): string {
    const base = 'px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0';
    if (this.activeCategory() === catId) {
      return `${base} bg-gradient-to-r from-purple-500 to-violet-600 text-white`;
    }
    return `${base} bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white`;
  }

  getCategoryCount(catId: string): number {
    return this.componentsLocal().filter(c => c.category_id === catId).length;
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

  canShowWeightPreview(): boolean {
    const type = this.selectedComponentType();
    if (!type) return false;

    const weight = parseFloat(this.newComponent.weight_per_unit_kg);
    return weight > 0 && this.newComponent.quantity > 0;
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
      } else {
        this.newComponent.weight_per_unit_kg = '';
      }
    }
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
    const profile = this.selectedProfile();

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
}
