import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Home, Plus, Eye, MessageSquare, TrendingUp, Crown,
  Edit, Trash2, BarChart3, Users, DollarSign, Star,
  Upload, Image, Settings, Bell, Sparkles, User, Heart
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  status: string;
  views: number; // mapped from view_count
  inquiries: number; // mapped from save_count for now
  view_count: number;
  save_count: number;
  is_premium: boolean; // mapped from is_premium
  isPremium: boolean;
  cover_image: string;
  image: string; // fallback
  created_at: string;
}

interface AnalyticsData {
  total_properties: number;
  total_views: number;
  total_saves: number;
  total_reviews: number;
  average_rating: number;
  properties: Property[];
}

export default function LandlordDashboard() {
  const [activeTab, setActiveTab] = useState<'properties' | 'analytics' | 'premium'>('properties');
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    total_properties: 0,
    total_views: 0,
    total_saves: 0,
    total_reviews: 0,
    average_rating: 0,
    properties: []
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/properties/analytics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          console.error("Failed to fetch analytics");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, API_URL]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const response = await fetch(`${API_URL}/api/properties/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({ title: "Property deleted" });
        setData(prev => ({
          ...prev,
          properties: prev.properties.filter(p => p.id !== id),
          total_properties: prev.total_properties - 1
        }));
      }
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (!user || user.role !== 'LANDLORD') {
    // Should be handled by RoleGuard but fallback here
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Access Restricted. <Link to="/" className="text-primary">Go Home</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Landlord Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your properties and track performance</p>
            </div>
            <div className="flex gap-3">
              <Link to="/messages">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Button>
              </Link>
              <Link to="/landlord-profile">
                <Button variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
              <Link to="/add-property">
                <Button className="gap-2 group">
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  Add New Property
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Views', value: data.total_views.toLocaleString(), icon: Eye, color: 'text-primary' },
              { label: 'Saves/Inquiries', value: data.total_saves, icon: Heart, color: 'text-emerald' },
              { label: 'Properties', value: data.total_properties, icon: Home, color: 'text-amber' },
              { label: 'Avg Rating', value: data.average_rating > 0 ? `${data.average_rating} ★` : '-', icon: Star, color: 'text-violet' },
            ].map((stat, index) => (
              <Card
                key={stat.label}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color} opacity-70 group-hover:scale-110 transition-transform`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'properties', label: 'My Properties', icon: Home },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'premium', label: 'Premium Ads', icon: Crown },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="gap-2 whitespace-nowrap transition-all duration-300"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-4 animate-fade-in">
              {loading ? (
                <div className="text-center py-12">Loading properties...</div>
              ) : data.properties.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                  <Home className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <h3 className="text-lg font-medium">No properties yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first property to start listing</p>
                  <Button asChild onClick={() => navigate('/add-property')}>
                    <Link to="/add-property">Add Property</Link>
                  </Button>
                </div>
              ) : (
                data.properties.map((property, index) => (
                  <Card
                    key={property.id}
                    className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-48 h-32 md:h-auto">
                          <img
                            src={property.cover_image || "/placeholder.jpg"}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                          {(property.is_premium || property.isPremium) && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-gradient-to-r from-amber to-amber/80 text-white gap-1 animate-pulse">
                                <Crown className="w-3 h-3" />
                                Premium
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div onClick={() => navigate(`/property/${property.id}`)} className="cursor-pointer">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {property.title}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {property.view_count || property.views || 0} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {property.save_count || property.inquiries || 0} saves
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={'default'}>
                                Active
                              </Badge>
                              <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => navigate(`/property/${property.id}`)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:text-primary">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(property.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Add Property Card */}
              <Card
                className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => navigate('/add-property')}
              >
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Add New Property</h3>
                  <p className="text-sm text-muted-foreground mt-1">Upload photos and details to list your property</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Total Views', value: data.total_views.toLocaleString(), change: '', positive: true },
                      { label: 'Total Saves', value: data.total_saves.toLocaleString(), change: '', positive: true },
                      { label: 'Total Reviews', value: data.total_reviews.toLocaleString(), change: '', positive: true },
                      { label: 'Avg Rating', value: data.average_rating > 0 ? `${data.average_rating} ★` : '-', change: '', positive: true },
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <span className="text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{item.value}</span>
                          {item.change && (
                            <Badge variant={item.positive ? 'default' : 'destructive'} className="text-xs">
                              {item.change}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Property Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.properties.slice(0, 5).map((property, index) => (
                      <div key={property.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate pr-2">{property.title}</span>
                          <span className="font-medium text-foreground">{property.view_count || property.views || 0} views</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-emerald rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(100, ((property.view_count || property.views || 0) / (Math.max(...data.properties.map(p => p.view_count || p.views || 0), 100))) * 100)}%`,
                              animationDelay: `${index * 200}ms`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Premium Tab */}
          {activeTab === 'premium' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Basic Boost',
                    price: '$9.99/mo',
                    features: ['Featured in search', '2x visibility', 'Priority support'],
                    popular: false,
                    gradient: 'from-muted to-muted/50'
                  },
                  {
                    name: 'Premium',
                    price: '$24.99/mo',
                    features: ['Homepage carousel', '5x visibility', 'Verified badge', 'Analytics dashboard'],
                    popular: true,
                    gradient: 'from-primary to-primary/80'
                  },
                  {
                    name: 'Enterprise',
                    price: '$49.99/mo',
                    features: ['All Premium features', '10x visibility', 'Dedicated manager', 'Custom branding'],
                    popular: false,
                    gradient: 'from-violet to-violet/80'
                  },
                ].map((plan, index) => (
                  <Card
                    key={plan.name}
                    className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${plan.popular ? 'ring-2 ring-primary' : ''
                      }`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber to-amber/80 gap-1">
                          <Sparkles className="w-3 h-3" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className={`bg-gradient-to-br ${plan.gradient} ${plan.popular ? 'text-primary-foreground' : ''}`}>
                      <CardTitle className="text-center">
                        <Crown className={`w-8 h-8 mx-auto mb-2 ${plan.popular ? 'text-amber animate-pulse' : 'text-muted-foreground'}`} />
                        {plan.name}
                        <div className="text-3xl font-bold mt-2">{plan.price}</div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-amber" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full mt-6"
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        {plan.popular ? 'Get Started' : 'Choose Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Current Ad Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald" />
                    Ad Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { label: 'Ad Spend', value: '$149.97', subtext: 'This month' },
                      { label: 'Impressions', value: '45,230', subtext: '+34% vs last month' },
                      { label: 'Click Rate', value: '3.2%', subtext: 'Above average' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-emerald">{stat.subtext}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
