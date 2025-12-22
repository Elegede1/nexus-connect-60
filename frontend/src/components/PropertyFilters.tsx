import { Search, SlidersHorizontal, MapPin, DollarSign, Home, Sofa, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NIGERIAN_STATES } from '@/constants/locations';

interface FiltersState {
  search: string;
  state: string;
  city: string;
  priceRange: string;
  propertyType: string;
  furnished: string;
}

interface PropertyFiltersProps {
  onFiltersChange: (filters: FiltersState) => void;
}

const priceRanges = ['Any Price', 'Below ₦500k', '₦500k - ₦1M', '₦1M - ₦3M', '₦3M - ₦5M', '₦5M+'];
const propertyTypes = ['All Types', 'Apartment', 'House', 'Condo', 'Studio', 'Townhouse'];
const furnishedOptions = ['Any', 'Furnished', 'Unfurnished'];

export function PropertyFilters({ onFiltersChange }: PropertyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    state: 'All States',
    city: 'All Cities',
    priceRange: 'Any Price',
    propertyType: 'All Types',
    furnished: 'Any',
  });

  const updateFilter = (key: keyof FiltersState, value: string) => {
    const newFilters = { ...filters, [key]: value };

    // Reset city if state changes to All States or a different state
    if (key === 'state') {
      newFilters.city = 'All Cities';
    }

    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FiltersState = {
      search: '',
      state: 'All States',
      city: 'All Cities',
      priceRange: 'Any Price',
      propertyType: 'All Types',
      furnished: 'Any',
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = filters.state !== 'All States' ||
    filters.city !== 'All Cities' ||
    filters.priceRange !== 'Any Price' ||
    filters.propertyType !== 'All Types' ||
    filters.furnished !== 'Any' ||
    filters.search !== '';

  const currentCities = filters.state !== 'All States'
    ? NIGERIAN_STATES.find(s => s.state === filters.state)?.cities || []
    : [];

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search properties by name, address..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
        />
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* State Filter */}
        <div className="relative group flex-1 min-w-[180px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald z-10" />
          <select
            value={filters.state}
            onChange={(e) => updateFilter('state', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
          >
            <option value="All States">All States</option>
            {NIGERIAN_STATES.map((state) => (
              <option key={state.state} value={state.state}>{state.state}</option>
            ))}
          </select>
        </div>

        {/* City Filter - Only Show if State is Selected */}
        {filters.state !== 'All States' && (
          <div className="relative group flex-1 min-w-[180px] animate-fade-in">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald z-10" />
            <select
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
            >
              <option value="All Cities">All Cities</option>
              {currentCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        )}

        {/* Price Range */}
        <div className="relative group flex-1 min-w-[180px]">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber z-10" />
          <select
            value={filters.priceRange}
            onChange={(e) => updateFilter('priceRange', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
          >
            {priceRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        {/* Property Type */}
        <div className="relative group flex-1 min-w-[180px]">
          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet z-10" />
          <select
            value={filters.propertyType}
            onChange={(e) => updateFilter('propertyType', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Advanced Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "gap-2 transition-all duration-300",
            showAdvanced && "bg-primary text-primary-foreground border-primary"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          showAdvanced ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pt-4 border-t border-border/50 space-y-4">
          {/* Furnished Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sofa className="w-4 h-4 text-primary" />
              Furnishing:
            </div>
            <div className="flex gap-2">
              {furnishedOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => updateFilter('furnished', option)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    filters.furnished === option
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters & Clear */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                "{filters.search}"
                <button onClick={() => updateFilter('search', '')} className="hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.state !== 'All States' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald/10 text-emerald rounded-full text-sm">
                {filters.state}
                <button onClick={() => updateFilter('state', 'All States')} className="hover:text-emerald/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.city !== 'All Cities' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald/10 text-emerald rounded-full text-sm">
                {filters.city}
                <button onClick={() => updateFilter('city', 'All Cities')} className="hover:text-emerald/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.priceRange !== 'Any Price' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber/10 text-amber rounded-full text-sm">
                {filters.priceRange}
                <button onClick={() => updateFilter('priceRange', 'Any Price')} className="hover:text-amber/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.propertyType !== 'All Types' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet/10 text-violet rounded-full text-sm">
                {filters.propertyType}
                <button onClick={() => updateFilter('propertyType', 'All Types')} className="hover:text-violet/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.furnished !== 'Any' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue/10 text-blue-500 rounded-full text-sm">
                {filters.furnished}
                <button onClick={() => updateFilter('furnished', 'Any')} className="hover:text-blue-500/70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
