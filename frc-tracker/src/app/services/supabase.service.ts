import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project,
  Material,
  ComponentCategory,
  ProfileType,
  ProfileInput,
  Fastener,
  Subsystem,
  Component,
  ProjectWeightSummary,
  SubsystemWeightSummary,
  CategoryWeightSummary,
  FastenerShoppingItem,
  InventoryItem,
  UnitSystem
} from '../models';

const SUPABASE_URL = 'https://ymounjmyaomvibndsrwz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltb3Vuam15YW9tdmlibmRzcnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDY1MTgsImV4cCI6MjA4NDA4MjUxOH0.ZNNNkteI2tl3ijVSF7cWoOPMreyRBLTw7LvwI233WeA';

// Conversion constants
const KG_TO_LB = 2.20462;
const MM_TO_IN = 0.0393701;
const KG_M3_TO_LB_IN3 = 0.0000361273;

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Signals para estado reactivo
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  // Data signals
  project = signal<Project | null>(null);
  projectSummary = signal<ProjectWeightSummary | null>(null);
  subsystems = signal<Subsystem[]>([]);
  subsystemSummary = signal<SubsystemWeightSummary[]>([]);
  categorySummary = signal<CategoryWeightSummary[]>([]);
  categories = signal<ComponentCategory[]>([]);
  materials = signal<Material[]>([]);
  profiles = signal<ProfileType[]>([]);
  fasteners = signal<Fastener[]>([]);
  components = signal<Component[]>([]);
  fastenerShoppingList = signal<FastenerShoppingItem[]>([]);
  inventory = signal<InventoryItem[]>([]);

  // Track current subsystem for component loading
  private currentSubsystemId = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // ============================================================================
  // UNIT CONVERSION UTILITIES
  // ============================================================================

  private getUnitSystem(): UnitSystem {
    return this.project()?.unit_system || 'imperial';
  }

  private showDualUnits(): boolean {
    return this.project()?.show_dual_units || false;
  }

  kgToLb(kg: number): number {
    return kg * KG_TO_LB;
  }

  lbToKg(lb: number): number {
    return lb / KG_TO_LB;
  }

  mmToIn(mm: number): number {
    return mm * MM_TO_IN;
  }

  inToMm(inches: number): number {
    return inches / MM_TO_IN;
  }

  formatWeight(kg: number | null | undefined, forcedUnit?: 'kg' | 'lb' | 'g'): string {
    if (kg === null || kg === undefined) return '—';
    
    // Handle grams specifically
    if (forcedUnit === 'g') {
      return `${(kg * 1000).toFixed(1)} g`;
    }
    
    const unit = forcedUnit || (this.getUnitSystem() === 'imperial' ? 'lb' : 'kg');
    const showDual = this.showDualUnits() && !forcedUnit;
    
    if (unit === 'lb') {
      const lb = this.kgToLb(kg);
      const primary = `${lb.toFixed(3)} lb`;
      if (showDual) {
        return `${primary} (${kg.toFixed(4)} kg)`;
      }
      return primary;
    } else {
      const primary = `${kg.toFixed(4)} kg`;
      if (showDual) {
        const lb = this.kgToLb(kg);
        return `${primary} (${lb.toFixed(3)} lb)`;
      }
      return primary;
    }
  }

  formatWeightShort(kg: number | null | undefined): string {
    if (kg === null || kg === undefined) return '—';
    
    const unit = this.getUnitSystem() === 'imperial' ? 'lb' : 'kg';
    
    if (unit === 'lb') {
      return `${this.kgToLb(kg).toFixed(2)} lb`;
    }
    return `${kg.toFixed(3)} kg`;
  }

  formatLength(mm: number | null | undefined, forcedUnit?: 'mm' | 'in'): string {
    if (mm === null || mm === undefined) return '—';
    
    const unit = forcedUnit || (this.getUnitSystem() === 'imperial' ? 'in' : 'mm');
    const showDual = this.showDualUnits() && !forcedUnit;
    
    if (unit === 'in') {
      const inches = this.mmToIn(mm);
      const primary = `${inches.toFixed(3)} in`;
      if (showDual) {
        return `${primary} (${mm.toFixed(2)} mm)`;
      }
      return primary;
    } else {
      const primary = `${mm.toFixed(2)} mm`;
      if (showDual) {
        const inches = this.mmToIn(mm);
        return `${primary} (${inches.toFixed(3)} in)`;
      }
      return primary;
    }
  }

  formatDensity(kgM3: number | null | undefined): string {
    if (kgM3 === null || kgM3 === undefined) return '—';
    
    const unit = this.getUnitSystem();
    const showDual = this.showDualUnits();
    
    if (unit === 'imperial') {
      const lbIn3 = kgM3 * KG_M3_TO_LB_IN3;
      const primary = `${lbIn3.toFixed(6)} lb/in³`;
      if (showDual) {
        return `${primary} (${kgM3.toFixed(0)} kg/m³)`;
      }
      return primary;
    } else {
      const primary = `${kgM3.toFixed(0)} kg/m³`;
      if (showDual) {
        const lbIn3 = kgM3 * KG_M3_TO_LB_IN3;
        return `${primary} (${lbIn3.toFixed(6)} lb/in³)`;
      }
      return primary;
    }
  }

  formatArea(mm2: number | null | undefined): string {
    if (mm2 === null || mm2 === undefined) return '—';
    
    const unit = this.getUnitSystem();
    const showDual = this.showDualUnits();
    
    if (unit === 'imperial') {
      const in2 = mm2 * (MM_TO_IN * MM_TO_IN);
      const primary = `${in2.toFixed(4)} in²`;
      if (showDual) {
        return `${primary} (${mm2.toFixed(2)} mm²)`;
      }
      return primary;
    } else {
      const primary = `${mm2.toFixed(2)} mm²`;
      if (showDual) {
        const in2 = mm2 * (MM_TO_IN * MM_TO_IN);
        return `${primary} (${in2.toFixed(4)} in²)`;
      }
      return primary;
    }
  }

  getWeightUnit(): string {
    return this.getUnitSystem() === 'imperial' ? 'lb' : 'kg';
  }

  getLengthUnit(): string {
    return this.getUnitSystem() === 'imperial' ? 'in' : 'mm';
  }

  getDensityUnit(): string {
    return this.getUnitSystem() === 'imperial' ? 'lb/in³' : 'kg/m³';
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(1)}%`;
  }

  getProfileInputs(profile: ProfileType | null | undefined): { key: string; label: string; type: string; required: boolean; step?: number; default?: number }[] {
    if (!profile) return [];
    
    // Parse required_inputs if it's a string (from database JSON)
    let inputs = profile.required_inputs;
    if (typeof inputs === 'string') {
      try {
        inputs = JSON.parse(inputs);
      } catch {
        return [];
      }
    }
    
    // Return empty array if not an array
    if (!Array.isArray(inputs)) return [];
    
    return inputs;
  }

  calculateComponentWeight(
    profile: ProfileType | null | undefined,
    material: Material | null | undefined,
    properties: Record<string, any>
  ): number | null {
    if (!profile || !properties) return null;

    const density = material?.density_kg_m3 || 0;

    switch (profile.calculation_method) {
      case 'fixed':
        return parseFloat(properties['weight_kg']) || null;

      case 'linear':
        if (!profile.cross_section_area_mm2 || !density) return null;
        const lengthM = (parseFloat(properties['length_mm']) || 0) / 1000;
        if (lengthM <= 0) return null;
        return (profile.cross_section_area_mm2 / 1000000) * lengthM * density;

      case 'area':
        if (!density) return null;
        
        const lengthMm = parseFloat(properties['length_mm']) || 0;
        const widthMm = parseFloat(properties['width_mm']) || 0;
        const thicknessMm = parseFloat(properties['thickness_mm']) || 0;
        
        // NO usar default_thickness_mm como fallback automático
        // El usuario debe introducir el espesor explícitamente
        if (lengthMm <= 0 || widthMm <= 0 || thicknessMm <= 0) return null;
        
        const areaM2 = (lengthMm / 1000) * (widthMm / 1000);
        const thicknessM = thicknessMm / 1000;
        
        return areaM2 * thicknessM * density;

      case 'volume':
        if (!density) return null;
        const volumeM3 = ((parseFloat(properties['length_mm']) || 0) / 1000) *
                         ((parseFloat(properties['width_mm']) || 0) / 1000) *
                         ((parseFloat(properties['height_mm']) || 0) / 1000);
        if (volumeM3 <= 0) return null;
        return volumeM3 * density;

      case 'formula':
        // Custom formula evaluation would go here
        return null;

      default:
        return null;
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.fetchAllData();
    } catch (err) {
      console.error('Initialization error:', err);
      this.error.set('Failed to connect to database');
    } finally {
      this.loading.set(false);
    }
  }

  async fetchAllData(): Promise<void> {
    // 1. First fetch project and categories (categories don't depend on project)
    await Promise.all([
      this.fetchProject(),
      this.fetchCategories(),
    ]);

    // 2. Now that project exists, fetch everything that depends on it
    const project = this.project();
    if (project) {
      await Promise.all([
        this.fetchSubsystems(),
        this.fetchMaterials(),
        this.fetchProfiles(),
        this.fetchFasteners(),
        this.fetchProjectSummary(project.id),
        this.fetchSubsystemSummary(project.id),
        this.fetchCategorySummary(project.id),
        this.fetchFastenerShoppingList(project.id),
        this.fetchInventory(project.id),
      ]);

      // Re-fetch components if we have a current subsystem
      const currentSub = this.currentSubsystemId();
      if (currentSub) {
        await this.fetchSubsystemComponents(currentSub);
      }
    }
  }

  private async fetchProject(): Promise<void> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('is_archived', false)
      .limit(1)
      .single();

    if (!error && data) {
      this.project.set(data);
    }
  }

  private async fetchProjectSummary(projectId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('v_project_weight_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (!error && data) {
      this.projectSummary.set(data);
    }
  }

  private async fetchSubsystems(): Promise<void> {
    const project = this.project();
    if (!project) return;

    const { data, error } = await this.supabase
      .from('subsystems')
      .select('*')
      .eq('project_id', project.id)
      .eq('is_active', true)
      .order('display_order');

    if (!error) {
      this.subsystems.set(data || []);
    }
  }

  private async fetchSubsystemSummary(projectId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('v_subsystem_weight_summary')
      .select('*')
      .eq('project_id', projectId);

    if (!error) {
      this.subsystemSummary.set(data || []);
    }
  }

  private async fetchCategorySummary(projectId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('v_category_weight_summary')
      .select('*')
      .eq('project_id', projectId);

    if (!error) {
      this.categorySummary.set(data || []);
    }
  }

  private async fetchCategories(): Promise<void> {
    const { data, error } = await this.supabase
      .from('component_categories')
      .select('*')
      .order('display_order');

    if (!error) {
      this.categories.set(data || []);
    }
  }

  private async fetchMaterials(): Promise<void> {
    const project = this.project();
    const { data, error } = await this.supabase
      .from('materials')
      .select('*')
      .or(`is_global.eq.true,project_id.eq.${project?.id || '00000000-0000-0000-0000-000000000000'}`)
      .order('name');

    if (!error) {
      this.materials.set(data || []);
    }
  }

  private async fetchProfiles(): Promise<void> {
    const project = this.project();
    const { data, error } = await this.supabase
      .from('profile_types')
      .select('*')
      .or(`is_global.eq.true,project_id.eq.${project?.id || '00000000-0000-0000-0000-000000000000'}`)
      .eq('is_active', true)
      .order('name');

    if (!error) {
      this.profiles.set(data || []);
    }
  }

  private async fetchFasteners(): Promise<void> {
    const project = this.project();
    const { data, error } = await this.supabase
      .from('fastener_catalog')
      .select('*')
      .or(`is_global.eq.true,project_id.eq.${project?.id || '00000000-0000-0000-0000-000000000000'}`)
      .eq('is_active', true)
      .order('name');

    if (!error) {
      this.fasteners.set(data || []);
    }
  }

  async fetchSubsystemComponents(subsystemId: string): Promise<Component[]> {
    // Track the current subsystem
    this.currentSubsystemId.set(subsystemId);

    const { data, error } = await this.supabase
      .from('components')
      .select('*')
      .eq('subsystem_id', subsystemId)
      .order('display_order');

    if (!error) {
      this.components.set(data || []);
      return data || [];
    }

    console.error('Error fetching components:', error);
    return [];
  }

  private async fetchFastenerShoppingList(projectId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('v_fastener_shopping_list')
      .select('*')
      .eq('project_id', projectId);

    if (!error) {
      this.fastenerShoppingList.set(data || []);
    }
  }

  private async fetchInventory(projectId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('v_inventory')
      .select('*')
      .eq('project_id', projectId);

    if (!error) {
      this.inventory.set(data || []);
    }
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async updateProject(projectId: string, data: Partial<Project>): Promise<boolean> {
    this.saving.set(true);
    const { error } = await this.supabase.from('projects').update(data).eq('id', projectId);
    this.saving.set(false);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  // ============================================================================
  // SUBSYSTEM OPERATIONS
  // ============================================================================

  async createSubsystem(data: Partial<Subsystem>): Promise<boolean> {
    const { error } = await this.supabase.from('subsystems').insert(data);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async updateSubsystem(subsystemId: string, data: Partial<Subsystem>): Promise<boolean> {
    const { error } = await this.supabase.from('subsystems').update(data).eq('id', subsystemId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async deleteSubsystem(subsystemId: string): Promise<boolean> {
    const { error } = await this.supabase.from('subsystems').update({ is_active: false }).eq('id', subsystemId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async duplicateSubsystem(subsystemId: string): Promise<boolean> {
    const original = this.subsystems().find(s => s.id === subsystemId);
    if (!original) return false;

    const { id, created_at, updated_at, ...data } = original;
    const newData = {
      ...data,
      name: `${original.name} (Copy)`,
      display_order: this.subsystems().length + 1
    };

    return this.createSubsystem(newData);
  }

  // ============================================================================
  // COMPONENT OPERATIONS
  // ============================================================================

  async addComponent(data: Partial<Component>): Promise<boolean> {
    this.saving.set(true);
    const { error } = await this.supabase.from('components').insert(data);
    this.saving.set(false);

    if (!error) {
      // Immediately refresh components for the subsystem
      if (data.subsystem_id) {
        await this.fetchSubsystemComponents(data.subsystem_id);
      }
      // Also refresh summaries
      const project = this.project();
      if (project) {
        await Promise.all([
          this.fetchProjectSummary(project.id),
          this.fetchSubsystemSummary(project.id),
          this.fetchCategorySummary(project.id),
        ]);
      }
      return true;
    }
    console.error('Error adding component:', error);
    return false;
  }

  async updateComponent(componentId: string, data: Partial<Component>): Promise<boolean> {
    this.saving.set(true);
    const { error } = await this.supabase.from('components').update(data).eq('id', componentId);
    this.saving.set(false);

    if (!error) {
      // Refresh components for the current subsystem
      const currentSub = this.currentSubsystemId();
      if (currentSub) {
        await this.fetchSubsystemComponents(currentSub);
      }
      // Also refresh summaries
      const project = this.project();
      if (project) {
        await Promise.all([
          this.fetchProjectSummary(project.id),
          this.fetchSubsystemSummary(project.id),
          this.fetchCategorySummary(project.id),
        ]);
      }
      return true;
    }
    return false;
  }

  async deleteComponent(componentId: string): Promise<boolean> {
    this.saving.set(true);
    const { error } = await this.supabase.from('components').delete().eq('id', componentId);
    this.saving.set(false);

    if (!error) {
      // Refresh components for the current subsystem
      const currentSub = this.currentSubsystemId();
      if (currentSub) {
        await this.fetchSubsystemComponents(currentSub);
      }
      // Also refresh summaries
      const project = this.project();
      if (project) {
        await Promise.all([
          this.fetchProjectSummary(project.id),
          this.fetchSubsystemSummary(project.id),
          this.fetchCategorySummary(project.id),
        ]);
      }
      return true;
    }
    return false;
  }

  // ============================================================================
  // MATERIAL OPERATIONS
  // ============================================================================

  async addMaterial(data: Partial<Material>): Promise<boolean> {
    const { error } = await this.supabase.from('materials').insert(data);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async updateMaterial(materialId: string, data: Partial<Material>): Promise<boolean> {
    const { error } = await this.supabase.from('materials').update(data).eq('id', materialId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async deleteMaterial(materialId: string): Promise<boolean> {
    const { error } = await this.supabase.from('materials').delete().eq('id', materialId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async duplicateMaterial(materialId: string): Promise<boolean> {
    const original = this.materials().find(m => m.id === materialId);
    if (!original || original.is_global) return false;

    const { id, created_at, updated_at, is_global, ...data } = original;
    const newData = {
      ...data,
      name: `${original.name} (Copy)`,
      project_id: this.project()?.id
    };

    return this.addMaterial(newData);
  }

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================

  async addProfile(data: Partial<ProfileType>): Promise<boolean> {
    const { error } = await this.supabase.from('profile_types').insert(data);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async updateProfile(profileId: string, data: Partial<ProfileType>): Promise<boolean> {
    const { error } = await this.supabase.from('profile_types').update(data).eq('id', profileId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async deleteProfile(profileId: string): Promise<boolean> {
    const { error } = await this.supabase.from('profile_types').delete().eq('id', profileId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async duplicateProfile(profileId: string): Promise<boolean> {
    const original = this.profiles().find(p => p.id === profileId);
    if (!original || original.is_global) return false;

    const { id, created_at, updated_at, is_global, ...data } = original;
    const newData = {
      ...data,
      name: `${original.name} (Copy)`,
      project_id: this.project()?.id
    };

    return this.addProfile(newData);
  }

  // ============================================================================
  // FASTENER OPERATIONS
  // ============================================================================

  async addFastener(data: Partial<Fastener>): Promise<boolean> {
    const { error } = await this.supabase.from('fastener_catalog').insert(data);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async updateFastener(fastenerId: string, data: Partial<Fastener>): Promise<boolean> {
    const { error } = await this.supabase.from('fastener_catalog').update(data).eq('id', fastenerId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async deleteFastener(fastenerId: string): Promise<boolean> {
    const { error } = await this.supabase.from('fastener_catalog').delete().eq('id', fastenerId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async duplicateFastener(fastenerId: string): Promise<boolean> {
    const original = this.fasteners().find(f => f.id === fastenerId);
    if (!original || original.is_global) return false;

    const { id, created_at, updated_at, is_global, ...data } = original;
    const newData = {
      ...data,
      name: `${original.name} (Copy)`,
      project_id: this.project()?.id
    };

    return this.addFastener(newData);
  }

  // ============================================================================
  // WEIGHT HISTORY
  // ============================================================================

  async createWeightSnapshot(note?: string): Promise<boolean> {
    const project = this.project();
    if (!project) return false;

    const { error } = await this.supabase.rpc('create_weight_snapshot', {
      p_project_id: project.id,
      p_note: note || null
    });

    return !error;
  }
}
