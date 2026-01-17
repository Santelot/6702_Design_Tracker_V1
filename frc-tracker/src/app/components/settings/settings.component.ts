import { Component, Input, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import {
  Project, Material, ProfileType, Fastener, ComponentCategory, Subsystem,
  NewMaterial, NewFastener, NewSubsystem, ProjectForm, UnitSystem
} from '../../models';
import { GlassCardComponent, ModalComponent } from '../shared';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, GlassCardComponent, ModalComponent],
  template: `
    <div class="flex-1 overflow-y-auto p-8 pb-24">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
        <p class="text-slate-400">Configure project parameters, materials, and component templates</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 bg-slate-800/50 rounded-xl mb-6">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            [class]="getTabClass(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Project Settings -->
      @if (activeTab() === 'project' && project) {
        <app-glass-card>
          <div class="p-6">
            <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              Project Configuration
            </h3>

            <div class="grid grid-cols-2 gap-6">
              <!-- Project Name -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Project Name</label>
                <input
                  type="text"
                  [(ngModel)]="projectForm.name"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <!-- Team Number -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Team Number</label>
                <input
                  type="text"
                  [(ngModel)]="projectForm.team_number"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <!-- Season Year -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Season Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  [(ngModel)]="projectForm.season_year"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <!-- Weight Limit -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Weight Limit</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.001"
                    [ngModel]="displayWeightLimit()"
                    (ngModelChange)="onWeightLimitChange($event)"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ currentWeightUnit() }}</span>
                </div>
                <p class="text-xs text-slate-500">
                  {{ projectForm.unit_system === 'imperial' 
                    ? (projectForm.weight_limit_kg | number:'1.3-3') + ' kg' 
                    : (supabase.kgToLb(projectForm.weight_limit_kg) | number:'1.2-2') + ' lb' }}
                </p>
              </div>

              <!-- Safety Factor -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Safety Factor</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="2"
                    [(ngModel)]="projectForm.safety_factor"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">×</span>
                </div>
              </div>
            </div>

            <!-- Unit System -->
            <div class="mt-6 p-4 rounded-xl bg-slate-800/30 border border-white/5">
              <h4 class="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                Unit System
              </h4>

              <div class="grid grid-cols-2 gap-4">
                <!-- Primary Unit System -->
                <div class="space-y-2">
                  <label class="block text-xs font-medium text-slate-400">Primary Units</label>
                  <div class="flex gap-2">
                    <button
                      (click)="projectForm.unit_system = 'imperial'"
                      [class]="projectForm.unit_system === 'imperial' 
                        ? 'flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg' 
                        : 'flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-slate-400 text-sm hover:bg-slate-700/50'"
                    >
                      Imperial (lb, in)
                    </button>
                    <button
                      (click)="projectForm.unit_system = 'metric'"
                      [class]="projectForm.unit_system === 'metric' 
                        ? 'flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg' 
                        : 'flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-slate-400 text-sm hover:bg-slate-700/50'"
                    >
                      Metric (kg, mm)
                    </button>
                  </div>
                </div>

                <!-- Dual Units Toggle -->
                <div class="space-y-2">
                  <label class="block text-xs font-medium text-slate-400">Display Mode</label>
                  <button
                    (click)="projectForm.show_dual_units = !projectForm.show_dual_units"
                    [class]="projectForm.show_dual_units 
                      ? 'w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-medium text-sm text-left shadow-lg' 
                      : 'w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-slate-400 text-sm text-left hover:bg-slate-700/50'"
                  >
                    <span class="flex items-center justify-between">
                      <span>{{ projectForm.show_dual_units ? 'Dual Units (Like Solidworks)' : 'Single Unit Display' }}</span>
                      <span [class]="projectForm.show_dual_units ? 'text-white' : 'text-slate-500'">
                        {{ projectForm.show_dual_units ? '✓ ON' : 'OFF' }}
                      </span>
                    </span>
                  </button>
                  <p class="text-xs text-slate-500">
                    {{ projectForm.show_dual_units ? 'Shows both units: primary (secondary)' : 'Shows only the primary unit' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Effective Weight Limit -->
            <div class="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-purple-300 font-medium">Effective Weight Limit</p>
                  <p class="text-xs text-slate-400 mt-1">Weight limit ÷ Safety factor</p>
                </div>
                <p class="text-2xl font-bold text-white">
                  {{ supabase.formatWeight(projectForm.weight_limit_kg / projectForm.safety_factor) }}
                </p>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="saveProject()"
                [disabled]="supabase.saving()"
                [class]="supabase.saving()
                  ? 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-500 text-sm cursor-not-allowed'
                  : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {{ supabase.saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </app-glass-card>
      }

      <!-- Subsystems -->
      @if (activeTab() === 'subsystems') {
        <div class="space-y-6">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-slate-400">{{ subsystems.length }} subsystems configured</p>
            <button
              (click)="isAddingSubsystem.set(true)"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Subsystem
            </button>
          </div>

          <app-glass-card>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/10">
                    <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Subsystem</th>
                    <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Color</th>
                    <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Budget</th>
                    <th class="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sub of subsystems; track sub.id) {
                    <tr class="border-b border-white/5 hover:bg-white/5">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-3 h-3 rounded-full" [style.backgroundColor]="sub.color"></div>
                          <span class="text-sm text-white font-medium">{{ sub.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-xs text-slate-400 font-mono">{{ sub.color }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-sm text-slate-300">
                          {{ sub.weight_budget_kg ? supabase.formatWeight(sub.weight_budget_kg) : '—' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            (click)="editSubsystem(sub)"
                            class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button
                            (click)="duplicateSubsystem(sub.id)"
                            class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="Duplicate"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                          </button>
                          <button
                            (click)="confirmDeleteSubsystem(sub)"
                            class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </app-glass-card>
        </div>
      }

      <!-- Materials -->
      @if (activeTab() === 'materials') {
        <div class="space-y-6">
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-slate-400">{{ materials.length }} materials configured</p>
            <button
              (click)="isAddingMaterial.set(true)"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Material
            </button>
          </div>

          <app-glass-card>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/10">
                    <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Material</th>
                    <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Category</th>
                    <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Density</th>
                    <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                    <th class="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (mat of materials; track mat.id) {
                    <tr class="border-b border-white/5 hover:bg-white/5">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-3 h-3 rounded-full" [style.backgroundColor]="mat.color"></div>
                          <span class="text-sm text-white font-medium">{{ mat.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-sm text-slate-300 capitalize">{{ mat.category }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-sm text-slate-300">{{ supabase.formatDensity(mat.density_kg_m3) }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <span [class]="mat.is_global 
                          ? 'px-2 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300' 
                          : 'px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300'">
                          {{ mat.is_global ? 'Global' : 'Custom' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-1">
                          <!-- Edit button - NOW WORKS FOR GLOBAL TOO -->
                          <button
                            (click)="editMaterial(mat)"
                            class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            [title]="mat.is_global ? 'Edit (will create copy)' : 'Edit'"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <!-- Duplicate button -->
                          <button
                            (click)="duplicateMaterial(mat.id)"
                            class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="Duplicate to Custom"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                          </button>
                          <!-- Delete button -->
                          <button
                            (click)="!mat.is_global && confirmDeleteMaterial(mat)"
                            [class]="mat.is_global 
                              ? 'p-2 rounded-lg text-slate-600 cursor-not-allowed' 
                              : 'p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors'"
                            [title]="mat.is_global ? 'Cannot delete global materials' : 'Delete'"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </app-glass-card>
        </div>
      }

      <!-- Profiles -->
      @if (activeTab() === 'profiles') {
        <div class="space-y-6">
          <!-- Sub-tabs and Add button in same row -->
          <div class="flex justify-between items-center">
            <div class="flex gap-2 p-1 bg-slate-800/30 rounded-xl w-fit">
              <button
                (click)="profileSubTab.set('profiles')"
                [class]="profileSubTab() === 'profiles' 
                  ? 'px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg' 
                  : 'px-6 py-2.5 rounded-lg text-slate-400 text-sm hover:text-white hover:bg-white/5'"
              >
                Profiles
              </button>
              <button
                (click)="profileSubTab.set('fasteners')"
                [class]="profileSubTab() === 'fasteners' 
                  ? 'px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg' 
                  : 'px-6 py-2.5 rounded-lg text-slate-400 text-sm hover:text-white hover:bg-white/5'"
              >
                Fasteners
              </button>
            </div>
            
            <!-- Add button changes based on active sub-tab -->
            @if (profileSubTab() === 'profiles') {
              <button
                (click)="isAddingProfile.set(true)"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Profile
              </button>
            } @else {
              <button
                (click)="isAddingFastener.set(true)"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Fastener
              </button>
            }
          </div>

          @if (profileSubTab() === 'profiles') {
            <p class="text-sm text-slate-400">{{ profiles.length }} profiles configured</p>

            <app-glass-card>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-white/10">
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Profile</th>
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Cross Section</th>
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Calc Method</th>
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                      <th class="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 min-w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (profile of profiles; track profile.id) {
                      <tr class="border-b border-white/5 hover:bg-white/5">
                        <td class="px-4 py-3">
                          <span class="text-sm text-white font-medium">{{ profile.name }}</span>
                        </td>
                        <td class="px-4 py-3">
                          <span class="text-sm text-slate-300">
                            {{ profile.cross_section_area_mm2 ? supabase.formatArea(profile.cross_section_area_mm2) : '—' }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <span [class]="getCalcMethodClass(profile.calculation_method)">
                            {{ formatCalcMethod(profile.calculation_method) }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <span [class]="profile.is_global 
                            ? 'px-2 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300' 
                            : 'px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300'">
                            {{ profile.is_global ? 'Global' : 'Custom' }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center justify-end gap-1">
                            <!-- Edit button - NOW WORKS FOR GLOBAL TOO -->
                            <button
                              (click)="editProfile(profile)"
                              class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              [title]="profile.is_global ? 'Edit (will create copy)' : 'Edit'"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <!-- Duplicate button -->
                            <button
                              (click)="duplicateProfile(profile.id)"
                              class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                              title="Duplicate to Custom"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                              </svg>
                            </button>
                            <!-- Delete button -->
                            <button
                              (click)="!profile.is_global && confirmDeleteProfile(profile)"
                              [class]="profile.is_global 
                                ? 'p-2 rounded-lg text-slate-600 cursor-not-allowed' 
                                : 'p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors'"
                              [title]="profile.is_global ? 'Cannot delete global profiles' : 'Delete'"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </app-glass-card>
          }

          @if (profileSubTab() === 'fasteners') {
            <p class="text-sm text-slate-400">{{ fasteners.length }} fasteners configured</p>

            <app-glass-card>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-white/10">
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Fastener</th>
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Size</th>
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Weight</th>
                      <th class="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">Type</th>
                      <th class="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 min-w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (fastener of fasteners; track fastener.id) {
                      <tr class="border-b border-white/5 hover:bg-white/5">
                        <td class="px-4 py-3">
                          <span class="text-sm text-white font-medium">{{ fastener.name }}</span>
                        </td>
                        <td class="px-4 py-3">
                          <span class="text-sm text-slate-300">{{ fastener.thread_size }} × {{ supabase.formatLength(fastener.length_mm) }}</span>
                        </td>
                        <td class="px-4 py-3">
                          <span class="text-sm text-slate-300">{{ supabase.formatWeight(fastener.weight_per_unit_kg) }}</span>
                        </td>
                        <td class="px-4 py-3">
                          <span [class]="fastener.is_global 
                            ? 'px-2 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300' 
                            : 'px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300'">
                            {{ fastener.is_global ? 'Global' : 'Custom' }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center justify-end gap-1">
                            <!-- Edit button - NOW WORKS FOR GLOBAL TOO -->
                            <button
                              (click)="editFastener(fastener)"
                              class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                              [title]="fastener.is_global ? 'Edit (will create copy)' : 'Edit'"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <!-- Duplicate button -->
                            <button
                              (click)="duplicateFastener(fastener.id)"
                              class="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                              title="Duplicate to Custom"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            </button>
                            <!-- Delete button -->
                            <button
                              (click)="!fastener.is_global && confirmDeleteFastener(fastener)"
                              [class]="fastener.is_global 
                                ? 'p-2 rounded-lg text-slate-600 cursor-not-allowed' 
                                : 'p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors'"
                              [title]="fastener.is_global ? 'Cannot delete global fasteners' : 'Delete'"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </app-glass-card>
          }
        </div>
      }

      <!-- Add Subsystem Modal -->
      @if (isAddingSubsystem() || isEditingSubsystem()) {
        <app-modal [isOpen]="true" [title]="isEditingSubsystem() ? 'Edit Subsystem' : 'Add Subsystem'" (closeModal)="closeSubsystemModal()">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Name</label>
              <input
                type="text"
                [(ngModel)]="newSubsystem.name"
                placeholder="e.g., Drivetrain, Intake, Shooter"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Description</label>
              <textarea
                [(ngModel)]="newSubsystem.description"
                placeholder="Optional description"
                rows="2"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Color</label>
                <input
                  type="color"
                  [(ngModel)]="newSubsystem.color"
                  class="w-full h-10 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Weight Budget</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.01"
                    [ngModel]="displaySubsystemBudget()"
                    (ngModelChange)="onSubsystemBudgetChange($event)"
                    placeholder="Optional"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ currentWeightUnit() }}</span>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button
                (click)="closeSubsystemModal()"
                class="px-4 py-2.5 rounded-xl text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                (click)="saveSubsystem()"
                [disabled]="!newSubsystem.name"
                [class]="!newSubsystem.name
                  ? 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-500 text-sm cursor-not-allowed'
                  : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (isEditingSubsystem()) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  }
                </svg>
                {{ isEditingSubsystem() ? 'Save Changes' : 'Add Subsystem' }}
              </button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Add Material Modal -->
      @if (isAddingMaterial() || isEditingMaterial()) {
        <app-modal [isOpen]="true" [title]="getModalTitle('material')" (closeModal)="closeMaterialModal()">
          <div class="space-y-4">
            <!-- Warning for editing global -->
            @if (isEditingMaterial() && editingIsGlobal()) {
              <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-2">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>This will create a <strong>custom copy</strong> of the global material. The original will remain unchanged.</span>
              </div>
            }
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Name</label>
              <input
                type="text"
                [(ngModel)]="newMaterial.name"
                placeholder="e.g., 6061-T6 Aluminum"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Density</label>
                <div class="relative">
                  <input
                    type="number"
                    step="1"
                    [(ngModel)]="newMaterial.density_kg_m3"
                    placeholder="e.g., 2700"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 pr-16"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg/m³</span>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Category</label>
                <select
                  [(ngModel)]="newMaterial.category"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="metal">Metal</option>
                  <option value="plastic">Plastic</option>
                  <option value="composite">Composite</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Color</label>
              <div class="flex gap-3">
                <input
                  type="color"
                  [(ngModel)]="newMaterial.color"
                  class="w-12 h-10 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  [(ngModel)]="newMaterial.color"
                  class="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button
                (click)="closeMaterialModal()"
                class="px-4 py-2.5 rounded-xl text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                (click)="saveMaterial()"
                [disabled]="!newMaterial.name || !newMaterial.density_kg_m3"
                [class]="(!newMaterial.name || !newMaterial.density_kg_m3)
                  ? 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-500 text-sm cursor-not-allowed'
                  : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (isEditingMaterial() && !editingIsGlobal()) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  }
                </svg>
                {{ getButtonText('material') }}
              </button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Add Fastener Modal -->
      @if (isAddingFastener() || isEditingFastener()) {
        <app-modal [isOpen]="true" [title]="getModalTitle('fastener')" (closeModal)="closeFastenerModal()">
          <div class="space-y-4">
            <!-- Warning for editing global -->
            @if (isEditingFastener() && editingFastenerIsGlobal()) {
              <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-2">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>This will create a <strong>custom copy</strong> of the global fastener. The original will remain unchanged.</span>
              </div>
            }
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Name</label>
              <input
                type="text"
                [(ngModel)]="newFastener.name"
                placeholder="e.g., M3x10 Socket Head"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Standard</label>
                <select
                  [(ngModel)]="newFastener.thread_standard"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Thread Size</label>
                <input
                  type="text"
                  [(ngModel)]="newFastener.thread_size"
                  placeholder="M3 or #10-32"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Length</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.1"
                    [(ngModel)]="newFastener.length_mm"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">mm</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Weight per Unit</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.00001"
                    [ngModel]="displayFastenerWeight()"
                    (ngModelChange)="onFastenerWeightChange($event)"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ currentWeightUnit() }}</span>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Head Type</label>
                <select
                  [(ngModel)]="newFastener.head_type"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="socket">Socket Head</option>
                  <option value="button">Button Head</option>
                  <option value="flat">Flat Head</option>
                  <option value="hex">Hex Head</option>
                  <option value="nylock">Nylock Nut</option>
                  <option value="lock">Lock Washer</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button
                (click)="closeFastenerModal()"
                class="px-4 py-2.5 rounded-xl text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                (click)="saveFastener()"
                [disabled]="!newFastener.name || !newFastener.weight_per_unit_kg"
                [class]="(!newFastener.name || !newFastener.weight_per_unit_kg)
                  ? 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-500 text-sm cursor-not-allowed'
                  : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (isEditingFastener() && !editingFastenerIsGlobal()) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  }
                </svg>
                {{ getButtonText('fastener') }}
              </button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Add Profile Modal -->
      @if (isAddingProfile() || isEditingProfile()) {
        <app-modal [isOpen]="true" [title]="getModalTitle('profile')" (closeModal)="closeProfileModal()">
          <div class="space-y-4">
            <!-- Warning for editing global -->
            @if (isEditingProfile() && editingProfileIsGlobal()) {
              <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-2">
                <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>This will create a <strong>custom copy</strong> of the global profile. The original will remain unchanged.</span>
              </div>
            }
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Name</label>
              <input
                type="text"
                [(ngModel)]="newProfile.name"
                placeholder="e.g., 1x1 Box Tube, 2x1 C-Channel"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Calculation Method</label>
                <select
                  [(ngModel)]="newProfile.calculation_method"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="fixed">Fixed Weight</option>
                  <option value="linear">Linear (per length)</option>
                  <option value="area">Area (per surface)</option>
                  <option value="volume">Volume</option>
                </select>
                <p class="text-xs text-slate-500">
                  @switch (newProfile.calculation_method) {
                    @case ('linear') { Weight = cross-section × length × density }
                    @case ('area') { Weight = length × width × thickness × density }
                    @case ('volume') { Weight = L × W × H × density }
                    @case ('fixed') { Manual weight entry }
                  }
                </p>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Cross Section Area</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.01"
                    [ngModel]="displayProfileArea()"
                    (ngModelChange)="onProfileAreaChange($event)"
                    placeholder="e.g., 161.29"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 pr-14"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{{ areaUnit() }}</span>
                </div>
                @if (projectForm.unit_system === 'imperial' && newProfile.cross_section_area_mm2) {
                  <p class="text-xs text-slate-500">{{ newProfile.cross_section_area_mm2 }} mm²</p>
                }
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button
                (click)="closeProfileModal()"
                class="px-4 py-2.5 rounded-xl text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                (click)="saveProfile()"
                [disabled]="!newProfile.name"
                [class]="!newProfile.name
                  ? 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-500 text-sm cursor-not-allowed'
                  : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium text-sm shadow-lg hover:shadow-purple-500/25 transition-all'"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  @if (isEditingProfile() && !editingProfileIsGlobal()) {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  } @else {
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  }
                </svg>
                {{ getButtonText('profile') }}
              </button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteConfirmation()) {
        <app-modal [isOpen]="true" title="Confirm Delete" (closeModal)="deleteConfirmation.set(null)">
          <div class="space-y-4">
            <p class="text-slate-300">
              Are you sure you want to delete <strong class="text-white">{{ deleteConfirmation()?.name }}</strong>?
              This action cannot be undone.
            </p>
            <div class="flex justify-end gap-3">
              <button
                (click)="deleteConfirmation.set(null)"
                class="px-4 py-2.5 rounded-xl text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                (click)="confirmDelete()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-medium text-sm shadow-lg"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </app-modal>
      }
    </div>
  `
})
export class SettingsComponent {
  @Input() project: Project | null = null;
  @Input() materials: Material[] = [];
  @Input() profiles: ProfileType[] = [];
  @Input() fasteners: Fastener[] = [];
  @Input() categories: ComponentCategory[] = [];
  @Input() subsystems: Subsystem[] = [];

  supabase = inject(SupabaseService);

  activeTab = signal('project');
  profileSubTab = signal<'profiles' | 'fasteners'>('profiles');

  isAddingSubsystem = signal(false);
  isEditingSubsystem = signal(false);
  editingSubsystemId = signal<string | null>(null);

  isAddingMaterial = signal(false);
  isEditingMaterial = signal(false);
  editingMaterialId = signal<string | null>(null);

  isAddingProfile = signal(false);
  isEditingProfile = signal(false);
  editingProfileId = signal<string | null>(null);

  isAddingFastener = signal(false);
  isEditingFastener = signal(false);
  editingFastenerId = signal<string | null>(null);

  // Track if we're editing a global item (to show warning)
  private editingGlobalMaterial = signal(false);
  private editingGlobalProfile = signal(false);
  private editingGlobalFastener = signal(false);

  deleteConfirmation = signal<{ type: string; id: string; name: string } | null>(null);

  tabs = [
    { id: 'project', label: 'Project' },
    { id: 'subsystems', label: 'Subsystems' },
    { id: 'materials', label: 'Materials' },
    { id: 'profiles', label: 'Profiles & Fasteners' },
  ];

  projectForm: ProjectForm = {
    name: '',
    team_number: '',
    season_year: new Date().getFullYear(),
    weight_limit_kg: 56.699,
    safety_factor: 1.10,
    unit_system: 'imperial',
    show_dual_units: false,
    logo_url: ''
  };

  newSubsystem: NewSubsystem = this.getEmptySubsystem();
  newMaterial: NewMaterial = this.getEmptyMaterial();
  newFastener: NewFastener = this.getEmptyFastener();
  newProfile: { name: string; calculation_method: string; cross_section_area_mm2: string } = this.getEmptyProfile();

  constructor() {
    effect(() => {
      const p = this.project;
      if (p) {
        this.projectForm = {
          name: p.name,
          team_number: p.team_number || '',
          season_year: p.season_year || new Date().getFullYear(),
          weight_limit_kg: p.weight_limit_kg,
          safety_factor: p.safety_factor,
          unit_system: (p as any).unit_system || 'imperial',
          show_dual_units: (p as any).show_dual_units || false,
          logo_url: (p as any).logo_url || ''
        };
      }
    }, { allowSignalWrites: true });
  }

  // ============================================================================
  // HELPER METHODS FOR GLOBAL EDITING
  // ============================================================================

  editingIsGlobal(): boolean {
    return this.editingGlobalMaterial();
  }

  editingProfileIsGlobal(): boolean {
    return this.editingGlobalProfile();
  }

  editingFastenerIsGlobal(): boolean {
    return this.editingGlobalFastener();
  }

  getModalTitle(type: 'material' | 'profile' | 'fastener'): string {
    switch (type) {
      case 'material':
        if (this.isEditingMaterial()) {
          return this.editingGlobalMaterial() ? 'Copy & Edit Material' : 'Edit Material';
        }
        return 'Add Material';
      case 'profile':
        if (this.isEditingProfile()) {
          return this.editingGlobalProfile() ? 'Copy & Edit Profile' : 'Edit Profile';
        }
        return 'Add Profile';
      case 'fastener':
        if (this.isEditingFastener()) {
          return this.editingGlobalFastener() ? 'Copy & Edit Fastener' : 'Edit Fastener';
        }
        return 'Add Fastener';
    }
  }

  getButtonText(type: 'material' | 'profile' | 'fastener'): string {
    switch (type) {
      case 'material':
        if (this.isEditingMaterial()) {
          return this.editingGlobalMaterial() ? 'Create Custom Copy' : 'Save Changes';
        }
        return 'Add Material';
      case 'profile':
        if (this.isEditingProfile()) {
          return this.editingGlobalProfile() ? 'Create Custom Copy' : 'Save Changes';
        }
        return 'Add Profile';
      case 'fastener':
        if (this.isEditingFastener()) {
          return this.editingGlobalFastener() ? 'Create Custom Copy' : 'Save Changes';
        }
        return 'Add Fastener';
    }
  }

  // ============================================================================
  // UNIT CONVERSION HELPERS
  // ============================================================================

  currentWeightUnit(): string {
    return this.projectForm.unit_system === 'imperial' ? 'lb' : 'kg';
  }

  areaUnit(): string {
    return this.projectForm.unit_system === 'imperial' ? 'in²' : 'mm²';
  }

  displayWeightLimit(): number {
    if (this.projectForm.unit_system === 'imperial') {
      return parseFloat(this.supabase.kgToLb(this.projectForm.weight_limit_kg).toFixed(3));
    }
    return parseFloat(this.projectForm.weight_limit_kg.toFixed(4));
  }

  onWeightLimitChange(value: number): void {
    if (this.projectForm.unit_system === 'imperial') {
      this.projectForm.weight_limit_kg = this.supabase.lbToKg(value);
    } else {
      this.projectForm.weight_limit_kg = value;
    }
  }

  displaySubsystemBudget(): string {
    if (!this.newSubsystem.weight_budget_kg) return '';
    const kg = parseFloat(this.newSubsystem.weight_budget_kg);
    if (isNaN(kg)) return '';
    if (this.projectForm.unit_system === 'imperial') {
      return this.supabase.kgToLb(kg).toFixed(2);
    }
    return kg.toFixed(3);
  }

  onSubsystemBudgetChange(value: number): void {
    if (!value) {
      this.newSubsystem.weight_budget_kg = '';
      return;
    }
    if (this.projectForm.unit_system === 'imperial') {
      this.newSubsystem.weight_budget_kg = this.supabase.lbToKg(value).toString();
    } else {
      this.newSubsystem.weight_budget_kg = value.toString();
    }
  }

  displayFastenerWeight(): string {
    if (!this.newFastener.weight_per_unit_kg) return '';
    const kg = parseFloat(this.newFastener.weight_per_unit_kg);
    if (isNaN(kg)) return '';
    if (this.projectForm.unit_system === 'imperial') {
      return this.supabase.kgToLb(kg).toFixed(6);
    }
    return kg.toFixed(6);
  }

  onFastenerWeightChange(value: number): void {
    if (!value) {
      this.newFastener.weight_per_unit_kg = '';
      return;
    }
    if (this.projectForm.unit_system === 'imperial') {
      this.newFastener.weight_per_unit_kg = this.supabase.lbToKg(value).toString();
    } else {
      this.newFastener.weight_per_unit_kg = value.toString();
    }
  }

  // Profile area conversion
  displayProfileArea(): string {
    if (!this.newProfile.cross_section_area_mm2) return '';
    const mm2 = parseFloat(this.newProfile.cross_section_area_mm2);
    if (isNaN(mm2)) return '';
    if (this.projectForm.unit_system === 'imperial') {
      // Convert mm² to in²
      return (mm2 * 0.0393701 * 0.0393701).toFixed(4);
    }
    return mm2.toFixed(2);
  }

  onProfileAreaChange(value: number): void {
    if (!value) {
      this.newProfile.cross_section_area_mm2 = '';
      return;
    }
    if (this.projectForm.unit_system === 'imperial') {
      // Convert in² to mm²
      this.newProfile.cross_section_area_mm2 = (value / (0.0393701 * 0.0393701)).toFixed(2);
    } else {
      this.newProfile.cross_section_area_mm2 = value.toString();
    }
  }

  getTabClass(tabId: string): string {
    const base = 'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200';
    if (this.activeTab() === tabId) {
      return `${base} bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg`;
    }
    return `${base} text-slate-400 hover:text-white hover:bg-white/5`;
  }

  // Calculation method display
  formatCalcMethod(method: string | undefined): string {
    switch (method) {
      case 'linear': return 'Linear';
      case 'area': return 'Area';
      case 'volume': return 'Volume';
      case 'fixed': return 'Fixed';
      case 'formula': return 'Formula';
      default: return '—';
    }
  }

  getCalcMethodClass(method: string | undefined): string {
    const base = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (method) {
      case 'linear': return `${base} bg-emerald-500/20 text-emerald-300`;
      case 'area': return `${base} bg-blue-500/20 text-blue-300`;
      case 'volume': return `${base} bg-purple-500/20 text-purple-300`;
      case 'fixed': return `${base} bg-slate-500/20 text-slate-300`;
      default: return `${base} bg-slate-500/20 text-slate-400`;
    }
  }

  // ============================================================================
  // PROJECT
  // ============================================================================

  async saveProject(): Promise<void> {
    if (!this.project) return;
    await this.supabase.updateProject(this.project.id, {
      name: this.projectForm.name,
      team_number: this.projectForm.team_number,
      season_year: this.projectForm.season_year,
      weight_limit_kg: this.projectForm.weight_limit_kg,
      safety_factor: this.projectForm.safety_factor,
      unit_system: this.projectForm.unit_system,
      show_dual_units: this.projectForm.show_dual_units
    } as any);
  }

  // ============================================================================
  // SUBSYSTEMS
  // ============================================================================

  getEmptySubsystem(): NewSubsystem {
    return { name: '', description: '', color: '#8B5CF6', weight_budget_kg: '' };
  }

  editSubsystem(sub: Subsystem): void {
    this.newSubsystem = {
      name: sub.name,
      description: sub.description || '',
      color: sub.color,
      weight_budget_kg: sub.weight_budget_kg?.toString() || ''
    };
    this.editingSubsystemId.set(sub.id);
    this.isEditingSubsystem.set(true);
  }

  closeSubsystemModal(): void {
    this.isAddingSubsystem.set(false);
    this.isEditingSubsystem.set(false);
    this.editingSubsystemId.set(null);
    this.newSubsystem = this.getEmptySubsystem();
  }

  async saveSubsystem(): Promise<void> {
    if (!this.project || !this.newSubsystem.name) return;

    const data = {
      name: this.newSubsystem.name,
      description: this.newSubsystem.description || undefined,
      color: this.newSubsystem.color,
      weight_budget_kg: this.newSubsystem.weight_budget_kg ? parseFloat(this.newSubsystem.weight_budget_kg) : undefined,
      project_id: this.project.id
    };

    if (this.isEditingSubsystem() && this.editingSubsystemId()) {
      await this.supabase.updateSubsystem(this.editingSubsystemId()!, data);
    } else {
      await this.supabase.createSubsystem(data);
    }

    this.closeSubsystemModal();
  }

  async duplicateSubsystem(id: string): Promise<void> {
    await this.supabase.duplicateSubsystem(id);
  }

  confirmDeleteSubsystem(sub: Subsystem): void {
    this.deleteConfirmation.set({ type: 'subsystem', id: sub.id, name: sub.name });
  }

  // ============================================================================
  // MATERIALS
  // ============================================================================

  getEmptyMaterial(): NewMaterial {
    return { name: '', density_kg_m3: '', category: 'metal', color: '#6B7280' };
  }

  editMaterial(mat: Material): void {
    this.newMaterial = {
      name: mat.is_global ? `${mat.name} (Custom)` : mat.name,
      density_kg_m3: mat.density_kg_m3.toString(),
      category: mat.category,
      color: mat.color
    };
    this.editingGlobalMaterial.set(mat.is_global);
    this.editingMaterialId.set(mat.is_global ? null : mat.id); // If global, we'll create new
    this.isEditingMaterial.set(true);
  }

  closeMaterialModal(): void {
    this.isAddingMaterial.set(false);
    this.isEditingMaterial.set(false);
    this.editingMaterialId.set(null);
    this.editingGlobalMaterial.set(false);
    this.newMaterial = this.getEmptyMaterial();
  }

  async saveMaterial(): Promise<void> {
    if (!this.project || !this.newMaterial.name) return;

    const data = {
      name: this.newMaterial.name,
      density_kg_m3: parseFloat(this.newMaterial.density_kg_m3),
      category: this.newMaterial.category as any,
      color: this.newMaterial.color,
      project_id: this.project.id,
      is_global: false
    };

    // If editing a non-global material, update it. Otherwise, create new.
    if (this.isEditingMaterial() && this.editingMaterialId() && !this.editingGlobalMaterial()) {
      await this.supabase.updateMaterial(this.editingMaterialId()!, data);
    } else {
      await this.supabase.addMaterial(data);
    }

    this.closeMaterialModal();
  }

  async duplicateMaterial(id: string): Promise<void> {
    await this.supabase.duplicateMaterial(id);
  }

  confirmDeleteMaterial(mat: Material): void {
    this.deleteConfirmation.set({ type: 'material', id: mat.id, name: mat.name });
  }

  // ============================================================================
  // PROFILES
  // ============================================================================

  getEmptyProfile(): { name: string; calculation_method: string; cross_section_area_mm2: string } {
    return { name: '', calculation_method: 'linear', cross_section_area_mm2: '' };
  }

  editProfile(profile: ProfileType): void {
    this.newProfile = {
      name: profile.is_global ? `${profile.name} (Custom)` : profile.name,
      calculation_method: profile.calculation_method || 'linear',
      cross_section_area_mm2: profile.cross_section_area_mm2?.toString() || ''
    };
    this.editingGlobalProfile.set(profile.is_global);
    this.editingProfileId.set(profile.is_global ? null : profile.id); // If global, we'll create new
    this.isEditingProfile.set(true);
  }

  closeProfileModal(): void {
    this.isAddingProfile.set(false);
    this.isEditingProfile.set(false);
    this.editingProfileId.set(null);
    this.editingGlobalProfile.set(false);
    this.newProfile = this.getEmptyProfile();
  }

  async saveProfile(): Promise<void> {
    if (!this.project || !this.newProfile.name) return;

    const data = {
      name: this.newProfile.name,
      calculation_method: this.newProfile.calculation_method as 'fixed' | 'linear' | 'area' | 'volume' | 'formula',
      cross_section_area_mm2: this.newProfile.cross_section_area_mm2 ? parseFloat(this.newProfile.cross_section_area_mm2) : undefined,
      project_id: this.project.id,
      is_global: false,
      is_active: true
    };

    // If editing a non-global profile, update it. Otherwise, create new.
    if (this.isEditingProfile() && this.editingProfileId() && !this.editingGlobalProfile()) {
      await this.supabase.updateProfile(this.editingProfileId()!, data);
    } else {
      await this.supabase.addProfile(data);
    }

    this.closeProfileModal();
  }

  async duplicateProfile(id: string): Promise<void> {
    await this.supabase.duplicateProfile(id);
  }

  confirmDeleteProfile(profile: ProfileType): void {
    this.deleteConfirmation.set({ type: 'profile', id: profile.id, name: profile.name });
  }

  // ============================================================================
  // FASTENERS
  // ============================================================================

  getEmptyFastener(): NewFastener {
    return { name: '', thread_standard: 'metric', thread_size: '', length_mm: '', head_type: 'socket', weight_per_unit_kg: '' };
  }

  editFastener(fastener: Fastener): void {
    this.newFastener = {
      name: fastener.is_global ? `${fastener.name} (Custom)` : fastener.name,
      thread_standard: fastener.thread_standard,
      thread_size: fastener.thread_size,
      length_mm: fastener.length_mm.toString(),
      head_type: fastener.head_type || 'socket',
      weight_per_unit_kg: fastener.weight_per_unit_kg.toString()
    };
    this.editingGlobalFastener.set(fastener.is_global);
    this.editingFastenerId.set(fastener.is_global ? null : fastener.id); // If global, we'll create new
    this.isEditingFastener.set(true);
  }

  closeFastenerModal(): void {
    this.isAddingFastener.set(false);
    this.isEditingFastener.set(false);
    this.editingFastenerId.set(null);
    this.editingGlobalFastener.set(false);
    this.newFastener = this.getEmptyFastener();
  }

  async saveFastener(): Promise<void> {
    if (!this.project || !this.newFastener.name) return;

    const data = {
      name: this.newFastener.name,
      thread_standard: this.newFastener.thread_standard as any,
      thread_size: this.newFastener.thread_size,
      length_mm: parseFloat(this.newFastener.length_mm),
      head_type: this.newFastener.head_type,
      weight_per_unit_kg: parseFloat(this.newFastener.weight_per_unit_kg),
      project_id: this.project.id,
      is_global: false,
      is_active: true,
      min_purchase_qty: 1
    };

    // If editing a non-global fastener, update it. Otherwise, create new.
    if (this.isEditingFastener() && this.editingFastenerId() && !this.editingGlobalFastener()) {
      await this.supabase.updateFastener(this.editingFastenerId()!, data);
    } else {
      await this.supabase.addFastener(data);
    }

    this.closeFastenerModal();
  }

  async duplicateFastener(id: string): Promise<void> {
    await this.supabase.duplicateFastener(id);
  }

  confirmDeleteFastener(fastener: Fastener): void {
    this.deleteConfirmation.set({ type: 'fastener', id: fastener.id, name: fastener.name });
  }

  // ============================================================================
  // DELETE CONFIRMATION
  // ============================================================================

  async confirmDelete(): Promise<void> {
    const confirm = this.deleteConfirmation();
    if (!confirm) return;

    switch (confirm.type) {
      case 'subsystem':
        await this.supabase.deleteSubsystem(confirm.id);
        break;
      case 'material':
        await this.supabase.deleteMaterial(confirm.id);
        break;
      case 'profile':
        await this.supabase.deleteProfile(confirm.id);
        break;
      case 'fastener':
        await this.supabase.deleteFastener(confirm.id);
        break;
    }

    this.deleteConfirmation.set(null);
  }
}
