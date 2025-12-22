import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyFilters } from '@/components/PropertyFilters';
import { Button } from '@/components/ui/button';
import { Grid3X3, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Properties listing page

export default function PropertyListings() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const propertiesPerPage = 6;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchProperties = async (filters: any = {}) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.state && filters.state !== 'All States') params.append('state', filters.state);
      if (filters.city && filters.city !== 'All Cities') params.append('city', filters.city);
      if (filters.propertyType && filters.propertyType !== 'All Types') {
        params.append('property_type', filters.propertyType.toUpperCase());
      }

      if (filters.priceRange && filters.priceRange !== 'Any Price') {
        if (filters.priceRange === 'Below ₦500k') params.append('max_price', '500000');
        else if (filters.priceRange === '₦500k - ₦1M') {
          params.append('min_price', '500000');
          params.append('max_price', '1000000');
        } else if (filters.priceRange === '₦1M - ₦3M') {
          params.append('min_price', '1000000');
          params.append('max_price', '3000000');
        } else if (filters.priceRange === '₦3M - ₦5M') {
          params.append('min_price', '3000000');
          params.append('max_price', '5000000');
        } else if (filters.priceRange === '₦5M+') params.append('min_price', '5000000');
      }

      if (filters.furnished && filters.furnished !== 'Any') {
        params.append('amenities', filters.furnished);
      }

      const response = await fetch(`${API_URL}/api/properties/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);

        // Map backend fields to frontend expectations if necessary
        const mappedResults = results.map((p: any) => ({
          id: p.id,
          title: p.title,
          location: p.location,
          state: p.state,
          city: p.city,
          price: p.price,
          bedrooms: p.num_bedrooms,
          bathrooms: p.num_bathrooms,
          sqft: p.sqft || 0,
          image: p.cover_image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
          type: p.property_type,
          isPremium: p.is_premium,
          isFurnished: p.amenities_list?.some((a: string) => a.toLowerCase().includes('furnished')),
          rating: p.average_rating,
          reviewCount: p.review_count,
        }));

        setProperties(mappedResults);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleFiltersChange = (filters: any) => {
    fetchProperties(filters);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(properties.length / propertiesPerPage);
  const paginatedProperties = properties.slice(
    (currentPage - 1) * propertiesPerPage,
    currentPage * propertiesPerPage
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Find Your Perfect <span className="text-gradient">Home</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Browse through hundreds of verified properties and find the one that fits your lifestyle.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="px-4 py-6">
        <div className="container mx-auto">
          <PropertyFilters onFiltersChange={handleFiltersChange} />
        </div>
      </section>

      {/* Results Section */}
      <section className="px-4 pb-16">
        <div className="container mx-auto">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{properties.length}</span> properties found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">View:</span>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-md transition-all duration-300",
                    viewMode === 'grid'
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-all duration-300",
                    viewMode === 'list'
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="List view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          {isLoading ? (
            <div
              className={cn(
                "grid gap-6",
                viewMode === 'grid'
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl overflow-hidden shadow-md border border-border/50 animate-pulse"
                >
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">No properties found matching your criteria.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-6 transition-all duration-500",
                viewMode === 'grid'
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 max-w-3xl mx-auto"
              )}
            >
              {paginatedProperties.map((property, index) => (
                <div
                  key={property.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PropertyCard {...property} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "transition-all duration-300",
                    currentPage === i + 1 && "scale-110"
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
