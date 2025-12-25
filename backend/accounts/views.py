from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    NotificationPreferenceSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Allows users to register with email, password, and role selection.
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully. Please log in.'
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view with user info and redirect information.
    Returns redirect URL based on user role.
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Add redirect URL based on role
            user_data = response.data.get('user', {})
            role = user_data.get('role')
            
            if role == 'LANDLORD':
                response.data['redirect_to'] = '/profile'
            else:  # TENANT
                response.data['redirect_to'] = '/listings'
        
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint to retrieve and update user profile.
    Only the authenticated user can view/edit their own profile.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class PublicUserProfileView(generics.RetrieveAPIView):
    """
    API endpoint to view another user's public profile (e.g. Tenant viewing Landlord).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = 'pk'


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    """
    API endpoint to manage notification preferences.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer
    
    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([AllowAny])
def set_pending_role(request):
    """
    Set pending role in session before OAuth redirect.
    Frontend calls this before redirecting to Google OAuth.
    """
    role = request.data.get('role')
    
    if not role or role not in ['LANDLORD', 'TENANT']:
        return Response(
            {'error': 'Valid role required (LANDLORD or TENANT)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Store role in session
    request.session['pending_role'] = role
    
    return Response({
        'message': 'Role set successfully. Proceed with OAuth.',
        'role': role
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Simple logout endpoint.
    Note: For JWT token blacklisting, implement using simplejwt's blacklist app.
    """
    return Response({
        'message': 'Logged out successfully. Please delete your token on the client side.'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def platform_metrics(request):
    """
    Get platform-wide metrics for the home page.
    - active_listings: Count of available properties.
    - happy_users: Count of active users.
    - satisfaction_rate: Average rating from reviews as percentage.
    """
    from reviews.models import Review
    from properties.models import Property
    from django.db.models import Avg
    
    # Active listings count
    active_listings = Property.objects.count()
    
    # Happy users (active users)
    happy_users = User.objects.filter(is_active=True).count()
    
    # Satisfaction rate from reviews (average rating as percentage of 5)
    avg_rating = Review.objects.aggregate(avg=Avg('rating'))['avg']
    satisfaction_rate = int((avg_rating / 5) * 100) if avg_rating else 98
    
    return Response({
        'active_listings': active_listings,
        'happy_users': happy_users,
        'satisfaction_rate': satisfaction_rate
    })


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    """
    Toggle follow status for a user (landlord).
    POST: Follow
    DELETE: Unfollow
    """
    from .models import Follow
    
    follower = request.user
    
    try:
        following = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if follower == following:
        return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
    if request.method == 'POST':
        follow, created = Follow.objects.get_or_create(follower=follower, following=following)
        if created:
            return Response({'message': f'You are now following {following.username}'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': f'You are already following {following.username}'}, status=status.HTTP_200_OK)
            
    elif request.method == 'DELETE':
        Follow.objects.filter(follower=follower, following=following).delete()
        return Response({'message': f'You unfollowed {following.username}'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_follow_status(request, user_id):
    """
    Check if the authenticated user is following the specified user.
    """
    from .models import Follow
    
    follower = request.user
    is_following = Follow.objects.filter(follower=follower, following_id=user_id).exists()
    
    return Response({'is_following': is_following})
