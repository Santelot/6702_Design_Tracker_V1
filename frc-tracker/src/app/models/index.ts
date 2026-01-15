// ============================================================================
// FRC DESIGN TRACKER - TYPESCRIPT INTERFACES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  team_number?: string;
  season_year: number;
  weight_limit_kg: number;
  safety_factor: number;
  image_url?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  project_id?: string;
  name: string;
  description?: string;
  density_kg_m3: number;
  color: string;
  category: 'metal' | 'plastic' | 'composite' | 'other';
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComponentCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color: string;
  display_order: number;
  is_system: boolean;
  allows_custom_weight: boolean;
  created_at: string;
}

export interface ProfileInput {
  key: string;
  label: string;
  type: string;
  required: boolean;
  step?: number;
  default?: number;
}

export interface ProfileType {
  id: string;
  project_id?: string;
  category_id?: string;
  name: string;
  description?: string;
  calculation_method: 'fixed' | 'linear' | 'area' | 'volume' | 'formula';
  cross_section_area_mm2?: number;
  default_thickness_mm?: number;
  formula_expression?: string;
  required_inputs: ProfileInput[] | string;
  default_properties?: Record<string, any>;
  is_global: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fastener {
  id: string;
  project_id?: string;
  name: string;
  thread_standard: 'imperial' | 'metric';
  thread_size: string;
  length_mm: number;
  head_type?: string;
  drive_type?: string;
  material?: string;
  finish?: string;
  weight_per_unit_kg: number;
  supplier?: string;
  part_number?: string;
  unit_cost?: number;
  purchase_url?: string;
  min_purchase_qty: number;
  is_global: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subsystem {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  image_url?: string;
  color: string;
  icon?: string;
  display_order: number;
  weight_budget_kg?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Component {
  id: string;
  subsystem_id: string;
  category_id?: string;
  profile_type_id?: string;
  fastener_id?: string;
  material_id?: string;
  name: string;
  description?: string;
  quantity: number;
  weight_per_unit_kg?: number;
  is_weight_calculated: boolean;
  properties: Record<string, any>;
  part_number?: string;
  supplier?: string;
  unit_cost?: number;
  purchase_url?: string;
  in_stock: boolean;
  stock_quantity: number;
  notes?: string;
  status: 'planned' | 'ordered' | 'received' | 'installed' | 'removed';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ComponentTag {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

// ============================================================================
// VIEW INTERFACES (from database views)
// ============================================================================

export interface ProjectWeightSummary {
  project_id: string;
  name: string;
  weight_limit_kg: number;
  safety_factor: number;
  effective_limit_kg: number;
  subsystem_count: number;
  component_count: number;
  total_weight_kg: number;
  weight_used_percent: number;
  remaining_weight_kg: number;
}

export interface SubsystemWeightSummary {
  subsystem_id: string;
  project_id: string;
  name: string;
  color: string;
  weight_budget_kg?: number;
  component_count: number;
  total_weight_kg: number;
  budget_used_percent?: number;
}

export interface CategoryWeightSummary {
  project_id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  color: string;
  component_count: number;
  total_units: number;
  total_weight_kg: number;
}

export interface FastenerShoppingItem {
  project_id: string;
  project_name: string;
  fastener_id: string;
  fastener_name: string;
  thread_size: string;
  length_mm: number;
  head_type?: string;
  material?: string;
  supplier?: string;
  part_number?: string;
  unit_cost?: number;
  purchase_url?: string;
  min_purchase_qty: number;
  total_needed: number;
  total_in_stock: number;
  to_purchase: number;
  estimated_cost?: number;
}

export interface InventoryItem {
  subsystem_id: string;
  project_id: string;
  subsystem_name: string;
  component_id: string;
  component_name: string;
  category_name?: string;
  quantity_needed: number;
  stock_quantity: number;
  in_stock: boolean;
  status: string;
  part_number?: string;
  supplier?: string;
  unit_cost?: number;
  total_cost?: number;
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

export interface NewComponent {
  name: string;
  category_id: string;
  profile_type_id: string;
  material_id: string;
  fastener_id: string;
  quantity: number;
  weight_per_unit_kg: string;
  properties: Record<string, any>;
  notes: string;
}

export interface NewSubsystem {
  name: string;
  description: string;
  color: string;
  weight_budget_kg: string;
}

export interface NewMaterial {
  name: string;
  density_kg_m3: string;
  category: string;
  color: string;
}

export interface NewFastener {
  name: string;
  thread_standard: string;
  thread_size: string;
  length_mm: string;
  head_type: string;
  weight_per_unit_kg: string;
}

export interface ProjectForm {
  name: string;
  team_number: string;
  weight_limit_kg: number;
  safety_factor: number;
}
