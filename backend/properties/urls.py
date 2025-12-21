from django.urls import path
from .views import (
    PropertyListCreateView,
    PropertyDetailView,
    FeaturedPropertiesView,
    LandlordPropertiesView,
    SavedPropertiesView,
    save_property,
    unsave_property,
    landlord_analytics,
    similar_properties,
    DeletePropertyImageView,
    DeletePropertyVideoView
)

app_name = 'properties'

urlpatterns = [
    # Property CRUD
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('<int:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('images/<int:pk>/delete/', DeletePropertyImageView.as_view(), name='delete-property-image'),
    path('videos/<int:pk>/delete/', DeletePropertyVideoView.as_view(), name='delete-property-video'),
    path('<int:pk>/similar/', similar_properties, name='similar-properties'),
    
    # Featured/Premium
    path('featured/', FeaturedPropertiesView.as_view(), name='featured-properties'),
    
    # Landlord
    path('my-properties/', LandlordPropertiesView.as_view(), name='my-properties'),
    path('analytics/', landlord_analytics, name='landlord-analytics'),
    
    # Tenant saved properties
    path('<int:pk>/save/', save_property, name='save-property'),
    path('<int:pk>/unsave/', unsave_property, name='unsave-property'),
    path('saved/', SavedPropertiesView.as_view(), name='saved-properties'),
]
