export interface Module {
  id: string; // UUID
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  version: string;
  route_path: string;
  is_core: boolean;
  is_available: boolean;
  price_monthly: string;
  requires_storage_mb: number;
  sort_order: number;
  metadata: any;
}
