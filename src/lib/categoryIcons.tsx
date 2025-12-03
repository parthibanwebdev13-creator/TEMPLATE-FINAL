import { 
  Droplets, 
  Wrench, 
  Car, 
  Cog, 
  Zap, 
  Thermometer, 
  Package, 
  Fuel,
  Settings,
  Shield,
  Factory,
  Gauge
} from 'lucide-react';

// Define keyword mappings for category icons
const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Oil-related keywords
  'oil': Droplets,
  'engine': Car,
  'transmission': Cog,
  'hydraulic': Settings,
  'gear': Wrench,
  'brake': Shield,
  'coolant': Thermometer,
  'grease': Package,
  'fuel': Fuel,
  'additive': Zap,
  'fluid': Droplets,
  'lubricant': Package,
  'industrial': Factory,
  'automotive': Car,
  'performance': Gauge,
  'efficiency': Zap,
  'protection': Shield,
  'maintenance': Wrench,
  'system': Settings,
  'equipment': Cog,
};

// Function to get icon for a category based on keywords
export function getCategoryIcon(categoryName: string): React.ComponentType<{ className?: string }> {
  const name = categoryName.toLowerCase();
  
  // Check for exact keyword matches first
  for (const [keyword, icon] of Object.entries(categoryIconMap)) {
    if (name.includes(keyword)) {
      return icon;
    }
  }
  
  // Default fallback icon
  return Package;
}

// Function to get all available keywords (useful for debugging or admin interface)
export function getAvailableKeywords(): string[] {
  return Object.keys(categoryIconMap);
}

// Function to add new keyword mappings dynamically
export function addKeywordMapping(keyword: string, icon: React.ComponentType<{ className?: string }>): void {
  categoryIconMap[keyword.toLowerCase()] = icon;
}
