
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Search, Home, MapPin, Bed, Bath, Square, User } from 'lucide-react';
import { formatNaira } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';

// Nigerian States and Cities Map
const NIGERIA_LOCATIONS: Record<string, string[]> = {
  "Lagos": ["Ikeja", "Lekki", "Victoria Island", "Ikoyi", "Yaba", "Surulere"],
  "Abuja (FCT)": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa"],
  "Rivers": ["Port Harcourt", "Obio-Akpor", "Bonny"],
  "Enugu": ["Enugu", "Nsukka"],
  "Oyo": ["Ibadan", "Ogbomosho"],
  "Kano": ["Kano", "Wudil"],
  // Add more as needed
};

interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
}

export default function TenantDashboard() {
  const { user } = useAuth();
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    // Simulate fetching saved properties
    // In real implementation, fetch from /api/properties/saved/
    setTimeout(() => {
      setSavedProperties([]); // Initialize to 0 as requested
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = () => {
    // Implement search logic or navigation to listings with query params
    const query = new URLSearchParams();
    if (selectedState) query.append('state', selectedState);
    if (selectedCity) query.append('city', selectedCity);
    window.location.href = `/listings?${query.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.first_name || 'Tenant'}</h1>
              <p className="text-muted-foreground mt-1">Find your next home in Nigeria</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/tenant-profile">
                <Button variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Search / Filter Section */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Search</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(NIGERIA_LOCATIONS).map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedState && NIGERIA_LOCATIONS[selectedState]?.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch} className="w-full gap-2">
                  <Search className="w-4 h-4" />
                  Search Properties
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Properties Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                Saved Properties
                <Badge variant="secondary" className="ml-2">{savedProperties.length}</Badge>
              </h2>
              <Link to="/listings" className="text-primary hover:underline text-sm font-medium">
                Browse all listings
              </Link>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : savedProperties.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No saved properties yet</h3>
                <p className="text-muted-foreground mb-4">Start browsing to find homes you love</p>
                <Link to="/listings">
                  <Button>Browse Properties</Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <div className="relative h-48">
                      <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <span className="text-white font-bold text-lg">{formatNaira(property.price)}/yr</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{property.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {property.location}
                      </p>
                      <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.beds}</span>
                        <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.baths}</span>
                        <span className="flex items-center gap-1"><Square className="w-3 h-3" /> {property.sqft}m²</span>
                      </div>
                      <Button className="w-full mt-4" variant="outline" asChild>
                        <Link to={`/property/${property.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
