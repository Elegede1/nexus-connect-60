import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { formatNaira } from "@/utils/format";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Bed,
  Bath,
  MapPin,
  Maximize,
  Home,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Phone,
  Calendar,
  Shield,
  Clock,
  Wifi,
  Car,
  Droplets,
  Lock,
  Zap,
  Wind,
  Tv,
  Utensils,
  ChevronDown,
  ChevronUp,
  Heart,
  CheckCircle2,
  Loader2,
  X,
  Edit,
  Share2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { cn } from "@/lib/utils";

// Fix Leaflet icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Amenity Icon Mapping
const AMENITY_ICONS: Record<string, any> = {
  "Parking": Car,
  "Security": Lock,
  "Water Supply": Droplets,
  "Internet/WiFi": Wifi,
  "Backup Power": Zap,
  "Air Conditioning": Wind,
  "Cable TV": Tv,
  "Kitchen": Utensils,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, token } = useAuth();

  const [property, setProperty] = useState<any>(null);
  const [similarProperties, setSimilarProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/properties/${id}/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Failed to fetch property');
      const data = await response.json();
      setProperty(data);
      setIsSaved(data.is_saved);

      // Fetch similar properties
      const simRes = await fetch(`${import.meta.env.VITE_API_URL}/api/properties/${id}/similar/`);
      if (simRes.ok) {
        setSimilarProperties(await simRes.json());
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Could not load property details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.id === property?.landlord?.id;

  const handleMessageLandlord = async () => {
    if (!user) {
      toast({ title: "Please login", description: "You need to be logged in to message the landlord." });
      navigate('/auth', { state: { from: location } });
      return;
    }

    if (user.role !== 'TENANT') {
      toast({ title: "Not allowed", description: "Only tenants can message landlords.", variant: "destructive" });
      return;
    }

    setContacting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/rooms/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ property_id: property.id })
      });

      if (response.ok) {
        const data = await response.json();
        const room = data.room;
        toast({ title: "Chat room ready", description: "Redirecting to messages..." });
        navigate('/messages', {
          state: {
            selectedRoomId: room.id,
            room: room,
            propertyId: property.id
          }
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to start conversation");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setContacting(false);
    }
  };

  const handleSaveProperty = async () => {
    if (!user) return navigate('/auth', { state: { from: location, isLogin: false } });
    // Optimistic update
    setIsSaved(!isSaved);
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      await fetch(`${import.meta.env.VITE_API_URL}/api/properties/${id}/save/`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      setIsSaved(!isSaved); // Revert
    }
  };

  const handleSubmitReview = async () => {
    if (!user) return navigate('/auth', { state: { from: location } });
    setSubmittingReview(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          landlord: property.landlord.id,
          property: property.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response.ok) {
        toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
        setIsReviewOpen(false);
        setReviewComment("");
        setReviewRating(5);
        fetchProperty(); // Refresh to show new rating
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Failed to submit review");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };


  const getMediaCount = () => {
    const imageCount = property?.images?.length || 0;
    const videoCount = property?.videos?.length || 0;
    return imageCount + videoCount || 1;
  };

  const nextImage = () => {
    const count = getMediaCount();
    setCurrentImageIndex((prev) => (prev + 1) % count);
  };

  const prevImage = () => {
    const count = getMediaCount();
    setCurrentImageIndex((prev) => (prev - 1 + count) % count);
  };

  const statusColors: Record<string, string> = {
    Available: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    Pending: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    Rented: "bg-red-500/20 text-red-500 border-red-500/30",
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;
  }

  if (!property) return <div className="min-h-screen bg-background pt-24 text-center">Property not found</div>;

  // Combine images and videos into a single media array
  // Videos appear after all images
  const mediaItems: { type: 'image' | 'video'; url: string }[] = [];

  if (property.images && property.images.length > 0) {
    property.images.forEach((img: any) => {
      mediaItems.push({ type: 'image', url: img.image_url });
    });
  }

  if (property.videos && property.videos.length > 0) {
    property.videos.forEach((vid: any) => {
      mediaItems.push({ type: 'video', url: vid.video_url });
    });
  }

  // Fallback if no media
  if (mediaItems.length === 0) {
    mediaItems.push({ type: 'image', url: "https://placehold.co/800x600?text=No+Image" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Media Carousel */}
          <div className="relative h-[60vh] rounded-2xl overflow-hidden mb-8 group bg-black">
            <div className="absolute inset-0">
              {mediaItems.map((media, index) => {
                const isVisible = Math.abs(index - currentImageIndex) <= 1 ||
                  (index === 0 && currentImageIndex === mediaItems.length - 1) ||
                  (index === mediaItems.length - 1 && currentImageIndex === 0);

                if (!isVisible) return null;

                return (
                  <div
                    key={index}
                    className={cn(
                      "absolute inset-0 w-full h-full transition-all duration-700 ease-in-out cursor-pointer",
                      index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    )}
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black">
                        <video
                          src={media.url}
                          className="w-full h-full object-contain"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                          </div>
                        </div>
                        <div className="absolute top-4 left-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm shadow-lg">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          Video Tour
                        </div>
                      </div>
                    ) : (
                      <img
                        src={media.url}
                        alt={`${property.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lightbox Dialog using existing Dialog component structure but maybe clearer to just use State */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
              <DialogContent
                className="max-w-[95vw] h-[95vh] p-0 bg-black border-none"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 text-white/90 hover:text-white hover:bg-white/20 z-[60] rounded-full w-12 h-12 bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsLightboxOpen(false)}
                  >
                    <X className="w-8 h-8" />
                    <span className="sr-only">Close</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 z-50 rounded-full w-12 h-12"
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 z-50 rounded-full w-12 h-12"
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>

                  {mediaItems[currentImageIndex]?.type === 'video' ? (
                    <video
                      src={mediaItems[currentImageIndex].url}
                      className="max-w-full max-h-full w-auto h-auto rounded-md"
                      controls
                      autoPlay
                      playsInline
                      controlsList="nodownload"
                    />
                  ) : (
                    <img
                      src={mediaItems[currentImageIndex]?.url}
                      alt={`Gallery ${currentImageIndex + 1}`}
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-md select-none"
                    />
                  )}

                  <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
                    {currentImageIndex + 1} / {mediaItems.length}
                  </div>
                </div>
              </DialogContent>
            </Dialog>


            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-background shadow-lg z-20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-background shadow-lg z-20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Click to expand overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            >
              <div className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
                <Maximize className="w-4 h-4" />
                <span>Click to view full screen</span>
              </div>
            </div>
            {/* Make overlay clickable trigger for lightbox */}
            <div
              className="absolute inset-0 z-10"
              onClick={() => setIsLightboxOpen(true)}
            />
            {/* Re-add controls on top of overlay */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveProperty(); }}
                className={cn(
                  "p-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-sm",
                  isSaved ? "bg-red-500 text-white" : "bg-white/90 text-foreground hover:bg-white"
                )}
              >
                <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-foreground transition-all duration-300 hover:scale-110 hover:bg-white shadow-sm"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {mediaItems.map((media, index: number) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 shadow-sm",
                    index === currentImageIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-white/50 hover:bg-white/80",
                    media.type === 'video' && index !== currentImageIndex && "bg-red-500/50"
                  )}
                />
              ))}
            </div>

            <div className="absolute top-4 left-4 flex gap-2 z-20 pointer-events-none">
              {property.is_premium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 animate-pulse shadow-lg">
                  ⭐ Premium
                </Badge>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 pointer-events-none z-20">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-md">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-white/90 drop-shadow-sm">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/landlord/${property.landlord.id}`);
                  }}
                >
                  <img
                    src={property.landlord?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=landlord"}
                    alt={property.landlord?.first_name}
                    className="w-6 h-6 rounded-full border border-white/50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=landlord";
                    }}
                  />
                  <span>{property.landlord?.first_name || "Landlord"} {property.landlord?.last_name || ""}</span>
                  {property.landlord?.verified && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {formatNaira(Number(property.price))}
                        <span className="text-lg font-normal text-muted-foreground">/year</span>
                      </p>
                    </div>
                    <Badge variant="outline" className="text-base px-4 py-2">
                      {property.property_type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Bed, label: "Bedrooms", value: property.num_bedrooms },
                      { icon: Bath, label: "Bathrooms", value: property.num_bathrooms },
                      { icon: Droplets, label: "Toilets", value: property.num_toilets },
                      { icon: Home, label: "Type", value: property.property_type },
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className="flex flex-col items-center p-4 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-muted hover:scale-105 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <item.icon className="w-6 h-6 text-primary mb-2" />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-6 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{property.location}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Description</h2>
                  <div
                    className={cn(
                      "text-muted-foreground leading-relaxed transition-all duration-500",
                      !isDescriptionExpanded && property.description.length > 300 && "line-clamp-4"
                    )}
                  >
                    {property.description}
                  </div>
                  {property.description.length > 300 && (
                    <Button
                      variant="ghost"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 text-primary hover:text-primary/80"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Read More
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {property.amenities_list && property.amenities_list.length > 0 ? (
                      property.amenities_list.map((amenityName: string, index: number) => {
                        const Icon = AMENITY_ICONS[amenityName] || Star;
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 transition-all duration-300 hover:bg-muted hover:scale-105 cursor-pointer animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <Icon className="w-5 h-5 text-primary" />
                            <span className="text-sm text-foreground">{amenityName}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">No amenities listed.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Map Section */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
                  <div className="h-[300px] w-full rounded-xl overflow-hidden z-0">
                    {property.latitude && property.longitude ? (
                      <MapContainer center={[property.latitude, property.longitude]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[property.latitude, property.longitude]}>
                          <Popup>
                            {property.title} <br /> {property.location}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                        Map data not available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {isOwner ? "Manage Property" : "Contact Landlord"}
                  </h3>

                  <div
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-300 mb-4 cursor-pointer hover:shadow-md border border-transparent hover:border-border/50"
                    onClick={() => navigate(`/landlord/${property.landlord.id}`)}
                  >
                    <img
                      src={property.landlord?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=landlord"}
                      alt={property.landlord?.first_name}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=landlord";
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{property.landlord?.first_name} {property.landlord?.last_name}</span>
                        {property.landlord?.verified && (
                          <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className={cn("w-4 h-4", property.average_rating > 0 ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                        <span>{property.average_rating > 0 ? property.average_rating : "No reviews"}</span>
                        {property.review_count > 0 && <span>({property.review_count})</span>}
                      </div>
                      <p className="text-xs text-primary mt-1 font-medium">View Profile</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {isOwner ? (
                      <Button className="w-full" variant="default" onClick={() => navigate(`/property/edit/${property.id}`)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Property
                      </Button>
                    ) : (
                      <>
                        {user && (
                          <Button className="w-full" variant="default" onClick={handleMessageLandlord} disabled={contacting}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {contacting ? 'Starting Chat...' : 'Message Landlord'}
                          </Button>
                        )}
                        {user && (
                          <>
                            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  <Star className="w-4 h-4 mr-2" />
                                  Rate Landlord
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rate Landlord</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex flex-col gap-2">
                                    <Label>Rating</Label>
                                    <div className="flex gap-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setReviewRating(star)}
                                          className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                          <Star
                                            className={cn(
                                              "w-8 h-8 transition-colors",
                                              star <= reviewRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                                            )}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="comment">Comment</Label>
                                    <Textarea
                                      id="comment"
                                      value={reviewComment}
                                      onChange={(e) => setReviewComment(e.target.value)}
                                      placeholder="Share your experience with this landlord..."
                                      rows={4}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                                  <Button onClick={handleSubmitReview} disabled={submittingReview}>
                                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                if (property.landlord?.phone_number) {
                                  window.location.href = `tel:${property.landlord.phone_number}`;
                                } else {
                                  toast({ title: "No Phone Number", description: "Landlord hasn't provided a phone number.", variant: "destructive" });
                                }
                              }}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              {property.landlord?.phone_number ? "Call Landlord" : "Number Unavailable"}
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Similar Properties */}
          {
            similarProperties.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Similar Properties</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {similarProperties.map((prop) => (
                    <Link to={`/property/${prop.id}`} key={prop.id} className="group block h-full">
                      <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors overflow-hidden">
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img
                            src={prop.cover_image || "https://placehold.co/400x300?text=No+Image"}
                            alt={prop.title}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="backdrop-blur-md bg-background/80">
                              {prop.property_type}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                              {prop.title}
                            </h3>
                          </div>
                          <p className="text-primary font-bold mb-2">
                            {formatNaira(Number(prop.price))}
                            <span className="text-xs font-normal text-muted-foreground">/year</span>
                          </p>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{prop.location}, {prop.city}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Bed className="w-4 h-4" />
                              <span>{prop.num_bedrooms}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="w-4 h-4" />
                              <span>{prop.num_bathrooms}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Droplets className="w-4 h-4" />
                              <span>{prop.num_toilets}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

        </div >
      </main >
    </div >
  );
}