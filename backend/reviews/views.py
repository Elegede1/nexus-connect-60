from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Review
from .serializers import ReviewSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class CreateReviewView(generics.CreateAPIView):
    """
    Create a new review for a landlord.
    Only tenants can create reviews.
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if not self.request.user.is_tenant():
            raise permissions.PermissionDenied("Only tenants can leave reviews.")
        serializer.save(tenant=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def landlord_reviews(request, landlord_id):
    """
    Get all reviews for a specific landlord.
    """
    reviews = Review.objects.filter(landlord_id=landlord_id)
    serializer = ReviewSerializer(reviews, many=True)
    
    # Calculate aggregate stats
    total_reviews = reviews.count()
    avg_rating = 0
    if total_reviews > 0:
        avg_rating = sum(r.rating for r in reviews) / total_reviews
        
    return Response({
        'reviews': serializer.data,
        'total_reviews': total_reviews,
        'average_rating': round(avg_rating, 1)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def recent_reviews(request):
    """
    Get the latest reviews for public display (testimonials).
    Returns up to 5 recent reviews.
    """
    reviews = Review.objects.select_related('tenant', 'landlord').order_by('-created_at')[:5]
    
    data = []
    for review in reviews:
        data.append({
            'id': review.id,
            'name': f"{review.tenant.first_name or 'User'} {review.tenant.last_name[0] if review.tenant.last_name else ''}.",
            'role': 'Tenant',
            'content': review.comment,
            'rating': review.rating,
            'avatar': review.tenant.first_name[0].upper() if review.tenant.first_name else 'U',
            'created_at': review.created_at.isoformat(),
        })
    
    return Response(data)
