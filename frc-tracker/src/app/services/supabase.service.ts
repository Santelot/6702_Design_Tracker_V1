import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project,
  Material,
  ComponentCategory,
  ProfileType,
  Fastener,
  Subsystem,
  Component,
  ProjectWeightSummary,
  SubsystemWeightSummary,
  CategoryWeightSummary,
  FastenerShoppingItem,
  InventoryItem
} from '../models';

const SUPABASE_URL = 'https://ymounjmyaomvibndsrwz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltb3Vuam15YW9tdmlibmRzcnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDY1MTgsImV4cCI6MjA4NDA4MjUxOH0.ZNNNkteI2tl3ijVSF7cWoOPMreyRBLTw7LvwI233WeA';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Signals para estado reactivo
  loading = signal(true);
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

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  formatWeight(kg: number | null | undefined, unit: 'kg' | 'lb' | 'g' = 'kg'): string {
    if (kg === null || kg === undefined) return '—';
    if (unit === 'lb') return `${(kg * 2.20462).toFixed(3)} lb`;
    if (unit === 'g') return `${(kg * 1000).toFixed(1)} g`;
    return `${kg.toFixed(4)} kg`;
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(1)}%`;
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
        return (profile.cross_section_area_mm2 / 1000000) * lengthM * density;

      case 'area':
        if (!density) return null;
        const areaM2 = ((parseFloat(properties['length_mm']) || 0) * (parseFloat(properties['width_mm']) || 0)) / 1000000;
        const thicknessM = (parseFloat(properties['thickness_mm']) || profile.default_thickness_mm || 0) / 1000;
        return areaM2 * thicknessM * density;

      case 'volume':
        if (!density) return null;
        const volumeM3 = ((parseFloat(properties['length_mm']) || 0) *
          (parseFloat(properties['width_mm']) || 0) *
          (parseFloat(properties['height_mm']) || 0)) / 1000000000;
        return volumeM3 * density;

      default:
        return null;
    }
  }

  getProfileInputs(profile: ProfileType): any[] {
    if (!profile?.required_inputs) return [];
    if (typeof profile.required_inputs === 'string') {
      try {
        return JSON.parse(profile.required_inputs);
      } catch {
        return [];
      }
    }
    return profile.required_inputs;
  }

  // ============================================================================
  // FETCH ALL DATA
  // ============================================================================

  async fetchAllData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Fetch or create project
      let { data: projects, error: projError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (projError) throw projError;

      let currentProject = projects?.[0];

      // Create default project if none exists
      if (!currentProject) {
        const { data: newProject, error: createError } = await this.supabase
          .from('projects')
          .insert({
            name: 'FRC 2025 Robot',
            team_number: '0000',
            season_year: 2025,
            weight_limit_kg: 56.699,
            safety_factor: 1.10
          })
          .select()
          .single();

        if (createError) throw createError;
        currentProject = newProject;
      }

      this.project.set(currentProject);

      // Fetch subsystems first (needed for components query)
      const { data: subsystemsData } = await this.supabase
        .from('subsystems')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('is_active', true)
        .order('display_order');

      this.subsystems.set(subsystemsData || []);

      // Fetch all related data in parallel
      const subsystemIds = (subsystemsData || []).map(s => s.id);

      const [
        { data: summaryData },
        { data: subsystemSummaryData },
        { data: categorySummaryData },
        { data: categoriesData },
        { data: materialsData },
        { data: profilesData },
        { data: fastenersData },
        { data: componentsData },
        { data: shoppingData },
        { data: inventoryData }
      ] = await Promise.all([
        this.supabase.from('v_project_weight_summary').select('*').eq('project_id', currentProject.id).single(),
        this.supabase.from('v_subsystem_weight_summary').select('*').eq('project_id', currentProject.id),
        this.supabase.from('v_category_weight_summary').select('*').eq('project_id', currentProject.id),
        this.supabase.from('component_categories').select('*').order('display_order'),
        this.supabase.from('materials').select('*').or(`is_global.eq.true,project_id.eq.${currentProject.id}`).order('name'),
        this.supabase.from('profile_types').select('*').or(`is_global.eq.true,project_id.eq.${currentProject.id}`).eq('is_active', true).order('name'),
        this.supabase.from('fastener_catalog').select('*').or(`is_global.eq.true,project_id.eq.${currentProject.id}`).eq('is_active', true).order('name'),
        subsystemIds.length > 0
          ? this.supabase.from('components').select('*').in('subsystem_id', subsystemIds).order('display_order')
          : Promise.resolve({ data: [] }),
        this.supabase.from('v_fastener_shopping_list').select('*').eq('project_id', currentProject.id),
        this.supabase.from('v_inventory_by_subsystem').select('*').eq('project_id', currentProject.id)
      ]);

      this.projectSummary.set(summaryData);
      this.subsystemSummary.set(subsystemSummaryData || []);
      this.categorySummary.set(categorySummaryData || []);
      this.categories.set(categoriesData || []);
      this.materials.set(materialsData || []);
      this.profiles.set(profilesData || []);
      this.fasteners.set(fastenersData || []);
      this.components.set(componentsData || []);
      this.fastenerShoppingList.set(shoppingData || []);
      this.inventory.set(inventoryData || []);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }

  // ============================================================================
  // FETCH SUBSYSTEM COMPONENTS
  // ============================================================================

  async fetchSubsystemComponents(subsystemId: string): Promise<void> {
    if (!subsystemId) return;

    const { data, error } = await this.supabase
      .from('components')
      .select('*')
      .eq('subsystem_id', subsystemId)
      .order('display_order');

    if (!error && data) {
      const currentComponents = this.components();
      const others = currentComponents.filter(c => c.subsystem_id !== subsystemId);
      this.components.set([...others, ...data]);
    }
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async updateProject(projectId: string, data: Partial<Project>): Promise<boolean> {
    const { error } = await this.supabase.from('projects').update(data).eq('id', projectId);
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

  // ============================================================================
  // COMPONENT OPERATIONS
  // ============================================================================

  async addComponent(data: Partial<Component>): Promise<boolean> {
    const { error } = await this.supabase.from('components').insert(data);
    if (!error) {
      if (data.subsystem_id) {
        await this.fetchSubsystemComponents(data.subsystem_id);
      }
      await this.fetchAllData();
      return true;
    }
    console.error('Error adding component:', error);
    return false;
  }

  async updateComponent(componentId: string, data: Partial<Component>): Promise<boolean> {
    const { error } = await this.supabase.from('components').update(data).eq('id', componentId);
    if (!error) {
      const comp = this.components().find(c => c.id === componentId);
      if (comp) {
        await this.fetchSubsystemComponents(comp.subsystem_id);
      }
      await this.fetchAllData();
      return true;
    }
    return false;
  }

  async deleteComponent(componentId: string): Promise<boolean> {
    const comp = this.components().find(c => c.id === componentId);
    const { error } = await this.supabase.from('components').delete().eq('id', componentId);
    if (!error) {
      if (comp) {
        await this.fetchSubsystemComponents(comp.subsystem_id);
      }
      await this.fetchAllData();
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

  async deleteMaterial(materialId: string): Promise<boolean> {
    const { error } = await this.supabase.from('materials').delete().eq('id', materialId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
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

  async deleteProfile(profileId: string): Promise<boolean> {
    const { error } = await this.supabase.from('profile_types').delete().eq('id', profileId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
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

  async deleteFastener(fastenerId: string): Promise<boolean> {
    const { error } = await this.supabase.from('fastener_catalog').delete().eq('id', fastenerId);
    if (!error) {
      await this.fetchAllData();
      return true;
    }
    return false;
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
