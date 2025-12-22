import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Plus,
  Crown,
  BarChart3,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle2,
  Eye,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Camera,
  Edit,
  Shield,
  Loader2,
  Users
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LandlordProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"properties" | "analytics" | "reviews">("properties");
  const { user: authUser, token: authToken } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalViews: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (authToken) {
      fetchProfile();
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
      // 1. Fetch Profile (which now includes properties and correct image URLs)
      const profileRes = await fetch(`${API_URL}/api/auth/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfileData(data);
        setProperties(data.properties || []);

        // Update stats from profile data properties
        if (data.properties) {
          const totalViews = data.properties.reduce((acc: number, curr: any) => acc + (curr.view_count || 0), 0);
          setStats(prev => ({
            ...prev,
            totalProperties: data.properties.length,
            totalViews,
          }));
        }

        // 2. Fetch Reviews for aggregate stats
        const reviewsRes = await fetch(`${API_URL}/api/reviews/landlord/${data.id}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (reviewsRes.ok) {
          const reviewData = await reviewsRes.json();
          setReviews(reviewData.reviews || []);
          setStats(prev => ({
            ...prev,
            averageRating: reviewData.average_rating || 0,
            totalReviews: reviewData.total_reviews || 0
          }));
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading && !profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                    src={profileData?.avatar || authUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=landlord"}
                    alt={getUserName()}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=landlord";
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
                  Verified Landlord
                </Badge>
              </div>

              {/* Write-up: Role • Member since • Properties */}
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground font-medium">
                <span>Professional Landlord</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>Member since {getMemberSince()}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>{stats.totalProperties} Properties</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap mt-2 md:mt-0">
              <Button variant="outline" className="gap-2 group transition-all hover:bg-muted" onClick={() => navigate('/settings')}>
                <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Account Settings
              </Button>
              <Button className="gap-2 group transition-all hover:shadow-lg" onClick={() => navigate('/add-property')}>
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Add Property
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
                  <CardTitle className="text-lg">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-primary" />
                      <span className="text-sm">Total Views</span>
                    </div>
                    <span className="font-bold text-foreground">{stats.totalViews.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">Followers</span>
                    </div>
                    <span className="font-bold text-foreground">{profileData?.followers_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-secondary" />
                      <span className="text-sm">Reviews</span>
                    </div>
                    <span className="font-bold text-foreground">{stats.totalReviews}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-amber-500" />
                      <span className="text-sm">Avg Rating</span>
                    </div>
                    <span className="font-bold text-foreground">{stats.averageRating.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Upgrade */}
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 overflow-hidden relative">
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Go Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Boost your listings and get 5x more visibility
                  </p>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2 group">
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
                  { id: "properties", label: "Properties", icon: Building2 },
                  { id: "analytics", label: "Analytics", icon: BarChart3 },
                  { id: "reviews", label: "Reviews", icon: Star },
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
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-fade-in">
                {activeTab === "properties" && (
                  <div className="space-y-4">
                    {/* Add Property Button - Always visible */}
                    <Button asChild className="w-full gap-2 h-14 text-lg group" variant="outline">
                      <Link to="/add-property">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Add New Property
                      </Link>
                    </Button>

                    {/* Property List */}
                    {properties.length > 0 ? (
                      properties.map((property, index) => (
                        <Card
                          key={property.id}
                          className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                          onClick={() => navigate(`/property/${property.id}`)}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex gap-4 p-4">
                            <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0">
                              <img
                                src={property.cover_image || property.images?.[0]?.image_url || "https://placehold.co/150"}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                              <p className="text-primary font-bold">₦{Number(property.price).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/yr</span></p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {property.view_count || 0}</span>
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {property.property_type}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 justify-center">
                              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/property/edit/${property.id}`); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground">No properties listed</h3>
                        <p className="text-muted-foreground mb-4">List your first property to start receiving inquiries</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div className="space-y-6">
                    {/* Analytics Empty State */}
                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground">No analytics data</h3>
                      <p className="text-muted-foreground">Stats will appear here once your properties get views</p>
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {reviews.length > 0 ? (
                      reviews.map((review, i) => (
                        <Card key={i} className="bg-card/50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                  {review.tenant_name ? review.tenant_name[0] : 'T'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{review.tenant_name || 'Tenant'}</p>
                                  <div className="flex text-amber-500">
                                    {[...Array(5)].map((_, r) => (
                                      <Star key={r} className={`w-3 h-3 ${r < review.rating ? 'fill-current' : 'text-muted'}`} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground">No reviews yet</h3>
                        <p className="text-muted-foreground">Reviews from your tenants will appear here.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div >
        </div >
      </main >

      <Footer />
    </div >
  );
};

export default LandlordProfile;
