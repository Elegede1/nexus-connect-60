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
