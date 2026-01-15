import { Component, Input, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import {
  Project, Material, ProfileType, Fastener, ComponentCategory,
  NewMaterial, NewFastener, NewSubsystem, ProjectForm
} from '../../models';
import { GlassCardComponent, ButtonComponent, ModalComponent } from '../shared';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, GlassCardComponent, ButtonComponent, ModalComponent],
  template: `
    <div class="flex-1 overflow-y-auto p-8">
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
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Project Name</label>
                <input
                  type="text"
                  [(ngModel)]="projectForm.name"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Team Number</label>
                <input
                  type="text"
                  [(ngModel)]="projectForm.team_number"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Weight Limit</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.001"
                    [(ngModel)]="projectForm.weight_limit_kg"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
                </div>
              </div>
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
              <app-button variant="primary" icon="save" (click)="saveProject()">
                Save Changes
              </app-button>
            </div>
          </div>
        </app-glass-card>
      }

      <!-- Subsystems -->
      @if (activeTab() === 'subsystems') {
        <div class="space-y-4">
          <div class="flex justify-end">
            <app-button variant="primary" icon="plus" (click)="isAddingSubsystem.set(true)">
              Add Subsystem
            </app-button>
          </div>

          <app-glass-card>
            <div class="p-6">
              <p class="text-slate-400 text-sm">
                Manage your robot's subsystems. Go to Settings → Subsystems in the sidebar to create and configure subsystems.
              </p>
              <div class="mt-4 grid grid-cols-3 gap-4">
                @for (sub of supabase.subsystems(); track sub.id) {
                  <div class="p-4 rounded-xl bg-slate-800/50 border border-white/10">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-3 h-3 rounded-full" [style.backgroundColor]="sub.color"></div>
                      <span class="text-white font-medium">{{ sub.name }}</span>
                    </div>
                    @if (sub.description) {
                      <p class="text-xs text-slate-500">{{ sub.description }}</p>
                    }
                  </div>
                }
              </div>
            </div>
          </app-glass-card>
        </div>

        <!-- Add Subsystem Modal -->
        <app-modal
          [isOpen]="isAddingSubsystem()"
          title="Add Subsystem"
          (closeModal)="isAddingSubsystem.set(false)"
        >
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Name</label>
              <input
                type="text"
                [(ngModel)]="newSubsystem.name"
                placeholder="e.g., Drivetrain"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Description</label>
              <input
                type="text"
                [(ngModel)]="newSubsystem.description"
                placeholder="Optional description..."
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Color</label>
                <input
                  type="color"
                  [(ngModel)]="newSubsystem.color"
                  class="w-full h-10 rounded-xl cursor-pointer"
                />
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Weight Budget (optional)</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.1"
                    [(ngModel)]="newSubsystem.weight_budget_kg"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <app-button variant="ghost" (click)="isAddingSubsystem.set(false)">Cancel</app-button>
              <app-button variant="primary" icon="plus" (click)="saveSubsystem()" [disabled]="!newSubsystem.name">
                Create Subsystem
              </app-button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Materials -->
      @if (activeTab() === 'materials') {
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <p class="text-sm text-slate-400">{{ materials.length }} materials configured</p>
            <app-button variant="primary" icon="plus" (click)="isAddingMaterial.set(true)">
              Add Material
            </app-button>
          </div>

          <app-glass-card>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/10">
                    <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Material</th>
                    <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Category</th>
                    <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Density</th>
                    <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  @for (mat of materials; track mat.id) {
                    <tr class="hover:bg-white/5">
                      <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                          <div class="w-4 h-4 rounded" [style.backgroundColor]="mat.color"></div>
                          <span class="text-white font-medium">{{ mat.name }}</span>
                        </div>
                      </td>
                      <td class="px-5 py-4 text-slate-400 capitalize">{{ mat.category }}</td>
                      <td class="px-5 py-4 text-right text-white">{{ mat.density_kg_m3 }} kg/m³</td>
                      <td class="px-5 py-4 text-center">
                        <span [class]="mat.is_global ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'" class="px-2 py-1 rounded text-xs">
                          {{ mat.is_global ? 'Global' : 'Project' }}
                        </span>
                      </td>
                      <td class="px-5 py-4 text-center">
                        @if (!mat.is_global) {
                          <button
                            (click)="deleteMaterial(mat.id)"
                            class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </app-glass-card>
        </div>

        <!-- Add Material Modal -->
        <app-modal
          [isOpen]="isAddingMaterial()"
          title="Add Material"
          (closeModal)="isAddingMaterial.set(false)"
        >
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Material Name</label>
              <input
                type="text"
                [(ngModel)]="newMaterial.name"
                placeholder="e.g., Aluminum 6063-T5"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Density</label>
              <div class="relative">
                <input
                  type="number"
                  [(ngModel)]="newMaterial.density_kg_m3"
                  placeholder="e.g., 2700"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 pr-16"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg/m³</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
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
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Color</label>
                <input
                  type="color"
                  [(ngModel)]="newMaterial.color"
                  class="w-full h-10 rounded-xl cursor-pointer"
                />
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <app-button variant="ghost" (click)="isAddingMaterial.set(false)">Cancel</app-button>
              <app-button
                variant="primary"
                icon="plus"
                (click)="saveMaterial()"
                [disabled]="!newMaterial.name || !newMaterial.density_kg_m3"
              >
                Add Material
              </app-button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Profiles -->
      @if (activeTab() === 'profiles') {
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <p class="text-sm text-slate-400">{{ profiles.length }} profiles configured</p>
            <app-button variant="primary" icon="plus" (click)="isAddingProfile.set(true)">
              Add Profile
            </app-button>
          </div>

          <app-glass-card>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/10">
                    <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Profile</th>
                    <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Method</th>
                    <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Cross Section</th>
                    <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  @for (profile of profiles; track profile.id) {
                    <tr class="hover:bg-white/5">
                      <td class="px-5 py-4 text-white font-medium">{{ profile.name }}</td>
                      <td class="px-5 py-4">
                        <span class="px-2 py-1 rounded bg-slate-700 text-xs text-slate-300 capitalize">
                          {{ profile.calculation_method }}
                        </span>
                      </td>
                      <td class="px-5 py-4 text-right text-slate-400">
                        {{ profile.cross_section_area_mm2 ? profile.cross_section_area_mm2 + ' mm²' : '—' }}
                      </td>
                      <td class="px-5 py-4 text-center">
                        <span [class]="profile.is_global ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'" class="px-2 py-1 rounded text-xs">
                          {{ profile.is_global ? 'Global' : 'Project' }}
                        </span>
                      </td>
                      <td class="px-5 py-4 text-center">
                        @if (!profile.is_global) {
                          <button
                            (click)="deleteProfile(profile.id)"
                            class="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </app-glass-card>
        </div>
      }

      <!-- Fasteners -->
      @if (activeTab() === 'fasteners') {
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <p class="text-sm text-slate-400">{{ fasteners.length }} fasteners in catalog</p>
            <app-button variant="primary" icon="plus" (click)="isAddingFastener.set(true)">
              Add Fastener
            </app-button>
          </div>

          <app-glass-card class="max-h-[600px] overflow-y-auto">
            <table class="w-full">
              <thead class="sticky top-0 bg-slate-900">
                <tr class="border-b border-white/10">
                  <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Fastener</th>
                  <th class="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Thread</th>
                  <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Length</th>
                  <th class="text-right px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Weight</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th class="text-center px-5 py-4 text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (f of fasteners; track f.id) {
                  <tr class="hover:bg-white/5">
                    <td class="px-5 py-3 text-white text-sm">{{ f.name }}</td>
                    <td class="px-5 py-3 text-slate-400 text-sm">{{ f.thread_size }}</td>
                    <td class="px-5 py-3 text-right text-slate-400 text-sm">{{ f.length_mm > 0 ? f.length_mm + ' mm' : '—' }}</td>
                    <td class="px-5 py-3 text-right text-white text-sm">{{ supabase.formatWeight(f.weight_per_unit_kg, 'g') }}</td>
                    <td class="px-5 py-3 text-center">
                      <span [class]="f.is_global ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'" class="px-2 py-1 rounded text-xs">
                        {{ f.is_global ? 'Global' : 'Project' }}
                      </span>
                    </td>
                    <td class="px-5 py-3 text-center">
                      @if (!f.is_global) {
                        <button
                          (click)="deleteFastener(f.id)"
                          class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </app-glass-card>
        </div>

        <!-- Add Fastener Modal -->
        <app-modal
          [isOpen]="isAddingFastener()"
          title="Add Fastener"
          (closeModal)="isAddingFastener.set(false)"
        >
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-400">Name</label>
              <input
                type="text"
                [(ngModel)]="newFastener.name"
                placeholder="e.g., M5x16 Socket Head"
                class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Thread Standard</label>
                <select
                  [(ngModel)]="newFastener.thread_standard"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="imperial">Imperial</option>
                  <option value="metric">Metric</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Thread Size</label>
                <input
                  type="text"
                  [(ngModel)]="newFastener.thread_size"
                  placeholder="e.g., 10-32, M5x0.8"
                  class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Length</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.01"
                    [(ngModel)]="newFastener.length_mm"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">mm</span>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-400">Weight per Unit</label>
                <div class="relative">
                  <input
                    type="number"
                    step="0.00001"
                    [(ngModel)]="newFastener.weight_per_unit_kg"
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 pr-12"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">kg</span>
                </div>
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
            <div class="flex justify-end gap-3 pt-4">
              <app-button variant="ghost" (click)="isAddingFastener.set(false)">Cancel</app-button>
              <app-button
                variant="primary"
                icon="plus"
                (click)="saveFastener()"
                [disabled]="!newFastener.name || !newFastener.weight_per_unit_kg"
              >
                Add Fastener
              </app-button>
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

  supabase = inject(SupabaseService);

  activeTab = signal('project');
  isAddingMaterial = signal(false);
  isAddingProfile = signal(false);
  isAddingFastener = signal(false);
  isAddingSubsystem = signal(false);

  projectForm: ProjectForm = { name: '', team_number: '', weight_limit_kg: 56.699, safety_factor: 1.10 };
  newMaterial: NewMaterial = { name: '', density_kg_m3: '', category: 'metal', color: '#6B7280' };
  newFastener: NewFastener = { name: '', thread_standard: 'imperial', thread_size: '', length_mm: '', head_type: 'socket', weight_per_unit_kg: '' };
  newSubsystem: NewSubsystem = { name: '', description: '', color: '#3B82F6', weight_budget_kg: '' };

  tabs = [
    { id: 'project', label: 'Project' },
    { id: 'subsystems', label: 'Subsystems' },
    { id: 'materials', label: 'Materials' },
    { id: 'profiles', label: 'Profiles' },
    { id: 'fasteners', label: 'Fasteners' },
  ];

  constructor() {
    effect(() => {
      const project = this.project;
      if (project) {
        this.projectForm = {
          name: project.name,
          team_number: project.team_number || '',
          weight_limit_kg: project.weight_limit_kg,
          safety_factor: project.safety_factor
        };
      }
    });
  }

  getTabClass(tabId: string): string {
    const base = 'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200';
    if (this.activeTab() === tabId) {
      return `${base} bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg`;
    }
    return `${base} text-slate-400 hover:text-white hover:bg-white/5`;
  }

  async saveProject(): Promise<void> {
    if (this.project) {
      await this.supabase.updateProject(this.project.id, this.projectForm);
    }
  }

  async saveMaterial(): Promise<void> {
    if (!this.project) return;
    await this.supabase.addMaterial({
      name: this.newMaterial.name,
      density_kg_m3: parseFloat(this.newMaterial.density_kg_m3),
      category: this.newMaterial.category as any,
      color: this.newMaterial.color,
      is_global: false,
      project_id: this.project.id
    });
    this.isAddingMaterial.set(false);
    this.newMaterial = { name: '', density_kg_m3: '', category: 'metal', color: '#6B7280' };
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.supabase.deleteMaterial(id);
  }

  async deleteProfile(id: string): Promise<void> {
    await this.supabase.deleteProfile(id);
  }

  async saveFastener(): Promise<void> {
    if (!this.project) return;
    await this.supabase.addFastener({
      name: this.newFastener.name,
      thread_standard: this.newFastener.thread_standard as any,
      thread_size: this.newFastener.thread_size,
      length_mm: parseFloat(this.newFastener.length_mm) || 0,
      head_type: this.newFastener.head_type,
      weight_per_unit_kg: parseFloat(this.newFastener.weight_per_unit_kg),
      is_global: false,
      is_active: true,
      project_id: this.project.id
    });
    this.isAddingFastener.set(false);
    this.newFastener = { name: '', thread_standard: 'imperial', thread_size: '', length_mm: '', head_type: 'socket', weight_per_unit_kg: '' };
  }

  async deleteFastener(id: string): Promise<void> {
    await this.supabase.deleteFastener(id);
  }

  async saveSubsystem(): Promise<void> {
    if (!this.project) return;
    await this.supabase.createSubsystem({
      name: this.newSubsystem.name,
      description: this.newSubsystem.description,
      color: this.newSubsystem.color,
      weight_budget_kg: this.newSubsystem.weight_budget_kg ? parseFloat(this.newSubsystem.weight_budget_kg) : undefined,
      project_id: this.project.id
    });
    this.isAddingSubsystem.set(false);
    this.newSubsystem = { name: '', description: '', color: '#3B82F6', weight_budget_kg: '' };
  }
}
