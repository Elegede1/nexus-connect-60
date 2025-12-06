from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import LeaseConfirmation, Review
from properties.models import Property
from .serializers import (
    LeaseConfirmationSerializer,
    LeaseConfirmationCreateSerializer,
    ReviewSerializer,
    ReviewCreateSerializer
)

User = get_user_model()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_lease(request):
    """
    Landlord confirms a lease with a tenant for a property.
    """
    if not request.user.is_landlord():
        return Response(
            {'error': 'Only landlords can confirm leases'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = LeaseConfirmationCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    property_id = serializer.validated_data['property_id']
    tenant_id = serializer.validated_data['tenant_id']
    notes = serializer.validated_data.get('notes', '')
    
    # Get property and verify ownership
    try:
        property_obj = Property.objects.get(pk=property_id, landlord=request.user)
    except Property.DoesNotExist:
        return Response(
            {'error': 'Property not found or you are not the owner'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get tenant
    try:
        tenant = User.objects.get(pk=tenant_id, role='TENANT')
    except User.DoesNotExist:
        return Response(
            {'error': 'Tenant not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create or get lease confirmation
    lease, created = LeaseConfirmation.objects.get_or_create(
        property=property_obj,
        landlord=request.user,
        tenant=tenant,
        defaults={'notes': notes}
    )
    
    return Response({
        'lease': LeaseConfirmationSerializer(lease).data,
        'created': created
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class LeaseListView(generics.ListAPIView):
    """
    List lease confirmations for the authenticated user.
    Landlords see their confirmed leases, tenants see leases they're part of.
    """
    serializer_class = LeaseConfirmationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_landlord():
            return LeaseConfirmation.objects.filter(landlord=user).select_related('property', 'tenant')
        elif user.is_tenant():
            return LeaseConfirmation.objects.filter(tenant=user).select_related('property', 'landlord')
        return LeaseConfirmation.objects.none()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    """
    Tenant creates a review for a property/landlord after lease confirmation.
    """
    if not request.user.is_tenant():
        return Response(
            {'error': 'Only tenants can create reviews'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ReviewCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    lease_conf_id = serializer.validated_data.pop('lease_confirmation_id')
    
    # Get lease confirmation
    try:
        lease = LeaseConfirmation.objects.select_related('property', 'landlord').get(
            pk=lease_conf_id,
            tenant=request.user
        )
    except LeaseConfirmation.DoesNotExist:
        return Response(
            {'error': 'Lease confirmation not found or you are not the tenant'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if review already exists
    if hasattr(lease, 'review'):
        return Response(
            {'error': 'You have already reviewed this lease'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create review
    review = Review.objects.create(
        lease_confirmation=lease,
        property=lease.property,
        landlord=lease.landlord,
        tenant=request.user,
        **serializer.validated_data
    )
    
    return Response(
        ReviewSerializer(review).data,
        status=status.HTTP_201_CREATED
    )


class PropertyReviewsView(generics.ListAPIView):
    """
    List public reviews for a specific property.
    """
    serializer_class = ReviewSerializer
    
    def get_queryset(self):
        property_id = self.kwargs['property_id']
        return Review.objects.filter(
            property_id=property_id,
            is_public=True
        ).select_related('tenant', 'property', 'landlord')


class LandlordReviewsView(generics.ListAPIView):
    """
    List public reviews for a specific landlord.
    """
    serializer_class = ReviewSerializer
    
    def get_queryset(self):
        landlord_id = self.kwargs['landlord_id']
        return Review.objects.filter(
            landlord_id=landlord_id,
            is_public=True
        ).select_related('tenant', 'property', 'landlord')
