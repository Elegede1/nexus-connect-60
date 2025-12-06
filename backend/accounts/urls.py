from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    CustomTokenObtainPairView,
    UserProfileView,
    NotificationPreferenceView,
    logout_view,
    set_pending_role
)

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view, name='logout'),
    path('set-role/', set_pending_role, name='set_pending_role'),  # For OAuth flow
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('notifications/', NotificationPreferenceView.as_view(), name='notification_preferences'),
]
