from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView,
    CustomTokenObtainPairView,
    UserProfileView,
    PublicUserProfileView,
    NotificationPreferenceView,
    logout_view,
    set_pending_role,
    platform_metrics,
    follow_user,
    check_follow_status
)

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view, name='logout'),
    path('set-role/', set_pending_role, name='set_pending_role'),  # For OAuth flow
    path('metrics/', platform_metrics, name='platform_metrics'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('public-profile/<int:pk>/', PublicUserProfileView.as_view(), name='public_profile'),
    path('notifications/', NotificationPreferenceView.as_view(), name='notification_preferences'),
    
    # Follow
    path('follow/<int:user_id>/', follow_user, name='follow_user'),
    path('follow/status/<int:user_id>/', check_follow_status, name='check_follow_status'),
]
