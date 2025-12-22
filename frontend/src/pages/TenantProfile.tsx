import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Crown,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  Heart,
  Clock,
  Home,
  Camera,
  Edit,
  Shield,
  Sparkles,
  Loader2
} from "lucide-react";
import { formatNaira } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";

const TenantProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"saved" | "history">("saved");
  const { user: authUser, token: authToken } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (authToken) {
      fetchProfile();
      fetchSavedProperties();
    } else {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        navigate('/auth');
      }
    }
  }, [authToken]);

  const fetchProfile = async () => {
    const token = authToken || localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedProperties = async () => {
    const token = authToken || localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/properties/saved/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedProperties(data);
      }
    } catch (error) {
      console.error('Error fetching saved properties:', error);
    }
  };

  const getUserName = () => {
    if (!profileData) return authUser?.username || 'User';
    if (profileData.first_name && profileData.last_name) {
      return `${profileData.first_name} ${profileData.last_name}`;
    }
    return profileData.username || profileData.email || 'User';
  };

  const getMemberSince = () => {
    const date = profileData?.created_at || (authUser as any)?.created_at;
    if (!date) return new Date().getFullYear();
    return new Date(date).getFullYear();
  }

  // Stats using real data
  const tenantStats = {
    trustScore: 4.9,
    reviewCount: 0,
    savedProperties: savedProperties.length,
  };

  // Rental history - empty for now
  const rentalHistory: any[] = [];

  if (isLoading && !profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Define Loader2 if not imported
  // But wait, Loader2 is from lucide-react. Let's make sure it's imported.


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="relative mb-16 md:mb-0">
            {/* Cover Photo */}
            <div className="h-48 rounded-2xl bg-muted overflow-hidden relative group">
              {profileData?.cover_photo ? (
                <img
                  src={profileData.cover_photo}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
                  <p className="text-muted-foreground">No cover photo</p>
                </div>
              )}
            </div>

            {/* Profile Avatar - Overlaps cover photo */}
            <div className="absolute left-8 -bottom-16 z-10">
              <div className="relative group shrink-0">
                <div className="w-32 h-32 rounded-2xl border-4 border-background bg-card overflow-hidden shadow-xl transition-transform duration-300 hover:scale-105">
                  <img
                    src={profileData?.avatar || authUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=tenant"}
                    alt={getUserName()}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=tenant";
                    }}
                  />
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="absolute bottom-2 right-2 p-2 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  title="Edit Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <div className="absolute -top-2 -right-2 p-1.5 bg-emerald-500 rounded-full animate-pulse">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info - Below Cover Photo */}
          <div className="mt-2 mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 px-4 md:px-0">
            <div className="md:pl-44 pt-2">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground">{getUserName()}</h1>
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 gap-1 rounded-full px-3">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Tenant
                </Badge>
              </div>

              {/* Write-up: Role • Member since • Saved */}
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground font-medium">
                <span>HomeHive Tenant</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>Member since {getMemberSince()}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>{tenantStats.savedProperties} Saved</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap mt-2 md:mt-0">
              <Button variant="outline" className="gap-2 group transition-all hover:bg-muted" onClick={() => navigate('/settings')}>
                <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Account Settings
              </Button>
              <Button className="gap-2 group transition-all hover:shadow-lg" onClick={() => navigate('/listings')}>
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Search Properties
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column - Contact & Stats */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileData?.phone_number && (
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{profileData.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>{profileData?.email || authUser?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{profileData?.location || "Location not set"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Activity Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-destructive" />
                      <span className="text-sm">Saved Properties</span>
                    </div>
                    <span className="font-bold text-foreground">{tenantStats.savedProperties}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Upgrade */}
              <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 overflow-hidden relative">
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-violet-500" />
                    Go Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get priority applications and instant landlord responses
                  </p>
                  <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white gap-2 group">
                    <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                {[
                  { id: "saved", label: "Saved Properties", icon: Heart },
                  { id: "history", label: "Rental History", icon: Clock },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${activeTab === tab.id
                      ? "bg-card text-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-fade-in">
                {activeTab === "saved" && (
                  <div className="grid gap-4">
                    {savedProperties.length > 0 ? (
                      savedProperties.map((property, index) => (
                        <Card
                          key={property.id}
                          className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                          style={{ animationDelay: `${index * 100}ms` }}
                          onClick={() => navigate(`/property/${property.id}`)}
                        >
                          <div className="flex gap-4 p-4">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate mb-1">{property.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{property.beds === 0 ? "Studio" : `${property.beds} bed`}</span>
                                <span>•</span>
                                <span>{property.baths} bath</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">{formatNaira(property.price)}</p>
                              <p className="text-sm text-muted-foreground">/month</p>
                              <Button size="sm" variant="ghost" className="mt-2 text-destructive hover:text-destructive">
                                <Heart className="w-4 h-4 fill-current" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                        <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground">No saved properties yet</h3>
                        <p className="text-muted-foreground mb-4">Start browsing to find homes you love</p>
                        <Button asChild>
                          <Link to="/listings">Browse Properties</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-4">
                    {rentalHistory.length > 0 ? (
                      rentalHistory.map((rental, index) => (
                        <Card
                          key={rental.id}
                          className="border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:shadow-lg transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-primary/20">
                              <Home className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{rental.property}</h3>
                              <p className="text-sm text-muted-foreground">Landlord: {rental.landlord}</p>
                              <p className="text-sm text-muted-foreground">{rental.period}</p>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= rental.rating ? "text-amber-500 fill-amber-500" : "text-muted"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TenantProfile;
