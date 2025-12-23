import { Heart, MapPin, Bed, Bath, Square, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  type: string;
  isPremium?: boolean;
  isFurnished?: boolean;
  rating?: number;
  reviewCount?: number;
  duration?: number;
  isSaved?: boolean;
}

export function PropertyCard({
  id,
  title,
  location,
  price,
  bedrooms,
  bathrooms,
  sqft,
  image,
  type,
  isPremium = false,
  isFurnished = false,
  rating = 0,
  reviewCount = 0,
  duration = 1,
  isSaved = false,
}: PropertyCardProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [isLiked, setIsLiked] = useState(isSaved);
  const [isLiking, setIsLiking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      const value = price / 1000000;
      return `₦${Number.isInteger(value) ? value : value.toFixed(1)}M`;
    }
    return `₦${price.toLocaleString()}`;
  };

  return (
    <Link to={`/property/${id}`} className="block group relative bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-border/50">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            imageLoaded && "hidden"
          )}
        />
        <img
          src={image}
          alt={title}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
            !imageLoaded && "opacity-0"
          )}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isPremium && (
            <Badge className="bg-amber text-white border-0 animate-pulse-glow">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Premium
            </Badge>
          )}
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
            {type}
          </Badge>
        </div>

        {/* Like Button */}
        <button
          onClick={async (e) => {
            e.preventDefault(); // Prevent link navigation
            if (!user) {
              navigate('/auth', { state: { from: routerLocation, isLogin: false } });
              return;
            }
            if (isLiking) return;

            // Optimistic update
            const nextState = !isLiked;
            setIsLiked(nextState);
            setIsLiking(true);

            try {
              const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
              const method = nextState ? 'POST' : 'DELETE';
              const response = await fetch(`${API_URL}/api/properties/${id}/save/`, {
                method,
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (!response.ok) {
                throw new Error("Failed to update favorite status");
              }
            } catch (error) {
              // Revert on error
              setIsLiked(!nextState);
              toast({
                title: "Error",
                description: "Could not update your favorites. Please try again.",
                variant: "destructive"
              });
            } finally {
              setIsLiking(false);
            }
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-all duration-300",
              isLiked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground"
            )}
          />
        </button>

        {/* Price Tag */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-sm">
          <span className="text-lg font-bold text-foreground">{formatPrice(price)}</span>
          <span className="text-sm text-muted-foreground">/{duration || 1} Year{(!duration || duration > 1) ? 's' : ''}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors duration-300 line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground mt-1">
            <MapPin className="w-4 h-4 text-emerald" />
            <span className="text-sm line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{bathrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              <span>{sqft}</span>
            </div>
          </div>

          {isFurnished && (
            <Badge variant="outline" className="text-xs">
              Furnished
            </Badge>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className={cn("w-4 h-4", (rating ?? 0) > 0 ? "fill-amber text-amber" : "text-muted-foreground")} />
          <span className="text-sm font-medium text-foreground">{(rating ?? 0) > 0 ? rating : "No reviews"}</span>
          {(reviewCount ?? 0) > 0 && <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>}
        </div>
      </div>
    </Link>
  );
}
