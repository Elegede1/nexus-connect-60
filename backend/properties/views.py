from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Property, SavedProperty
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyCreateUpdateSerializer,
    SavedPropertySerializer
)
from .permissions import IsLandlordOrReadOnly, IsPropertyOwner


class PropertyListCreateView(generics.ListCreateAPIView):
    """
    List all properties with search/filtering or create new property (landlords only).
    
    Query parameters:
    - city: Filter by location (case-insensitive contains)
    - zip_code: Filter by zip code
    - min_price: Minimum price
    - max_price: Maximum price
    - property_type: Filter by property type (APARTMENT, HOUSE, CONDO, TOWNHOUSE)
    - num_bedrooms: Filter by number of bedrooms
    - num_bathrooms: Filter by number of bathrooms
    - amenities: Comma-separated list of amenities to search for
    - search: General search across title and description
    """
    permission_classes = [IsLandlordOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price', 'created_at', 'view_count', 'save_count']
    ordering = ['-is_premium', '-created_at']  # Premium first, then newest
    
    def get_queryset(self):
        queryset = Property.objects.select_related('landlord').prefetch_related('images')
        
        # Search filters
        city = self.request.query_params.get('city')
        zip_code = self.request.query_params.get('zip_code')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        property_type = self.request.query_params.get('property_type')
        num_bedrooms = self.request.query_params.get('num_bedrooms')
        num_bathrooms = self.request.query_params.get('num_bathrooms')
        amenities = self.request.query_params.get('amenities')
        search = self.request.query_params.get('search')
        
        if city:
            queryset = queryset.filter(location__icontains=city)
        
        if zip_code:
            queryset = queryset.filter(zip_code=zip_code)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        if property_type:
            queryset = queryset.filter(property_type=property_type.upper())
        
        if num_bedrooms:
            queryset = queryset.filter(num_bedrooms=num_bedrooms)
        
        if num_bathrooms:
            queryset = queryset.filter(num_bathrooms=num_bathrooms)
        
        if amenities:
            # Search for amenities in JSON field
            amenity_list = [a.strip() for a in amenities.split(',')]
            for amenity in amenity_list:
                queryset = queryset.filter(amenities__icontains=amenity)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PropertyCreateUpdateSerializer
        return PropertyListSerializer


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a property.
    Increments view count on retrieval.
    Only owner can update/delete.
    """
    queryset = Property.objects.select_related('landlord').prefetch_related('images')
    permission_classes = [IsPropertyOwner]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PropertyCreateUpdateSerializer
        return PropertyDetailSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment view count (but not for the property owner)
        if not (request.user.is_authenticated and request.user == instance.landlord):
            instance.increment_views()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FeaturedPropertiesView(generics.ListAPIView):
    """
    List premium/featured properties for home page.
    """
    queryset = Property.objects.filter(is_premium=True).select_related('landlord').prefetch_related('images')
    serializer_class = PropertyListSerializer
    permission_classes = [AllowAny]


class LandlordPropertiesView(generics.ListAPIView):
    """
    List properties for the authenticated landlord.
    """
    serializer_class = PropertyListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_landlord():
            return Property.objects.none()
        return Property.objects.filter(landlord=self.request.user).prefetch_related('images')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_property(request, pk):
    """Save/bookmark a property (tenants only)"""
    if not request.user.is_tenant():
        return Response(
            {'error': 'Only tenants can save properties'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        property_obj = Property.objects.get(pk=pk)
    except Property.DoesNotExist:
        return Response(
            {'error': 'Property not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already saved
    saved, created = SavedProperty.objects.get_or_create(
        tenant=request.user,
        property=property_obj
    )
    
    if created:
        property_obj.increment_saves()
        return Response({'message': 'Property saved successfully'}, status=status.HTTP_201_CREATED)
    else:
        return Response({'message': 'Property already saved'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsave_property(request, pk):
    """Remove property from saved/bookmarks"""
    if not request.user.is_tenant():
        return Response(
            {'error': 'Only tenants can unsave properties'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        property_obj = Property.objects.get(pk=pk)
        saved = SavedProperty.objects.get(tenant=request.user, property=property_obj)
        saved.delete()
        property_obj.decrement_saves()
        return Response({'message': 'Property removed from saved'}, status=status.HTTP_200_OK)
    except Property.DoesNotExist:
        return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
    except SavedProperty.DoesNotExist:
        return Response({'error': 'Property not in saved list'}, status=status.HTTP_404_NOT_FOUND)


class SavedPropertiesView(generics.ListAPIView):
    """
    List saved properties for the authenticated tenant.
    """
    serializer_class = SavedPropertySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_tenant():
            return SavedProperty.objects.none()
        return SavedProperty.objects.filter(tenant=self.request.user).select_related('property__landlord').prefetch_related('property__images')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def landlord_analytics(request):
    """
    Get analytics for authenticated landlord's properties.
    Returns total views, messages, and saves across all properties.
    """
    if not request.user.is_landlord():
        return Response(
            {'error': 'Only landlords can access analytics'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    properties = Property.objects.filter(landlord=request.user)
    
    total_views = sum(p.view_count for p in properties)
    total_saves = sum(p.save_count for p in properties)
    total_properties = properties.count()
    
    # TODO: Add message count when chat app is implemented
    
    return Response({
        'total_properties': total_properties,
        'total_views': total_views,
        'total_saves': total_saves,
        'properties': PropertyListSerializer(properties, many=True).data
    })
