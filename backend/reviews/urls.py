from django.urls import path
from .views import (
    confirm_lease,
    LeaseListView,
    create_review,
    PropertyReviewsView,
    LandlordReviewsView
)

app_name = 'reviews'

urlpatterns = [
    # Lease confirmations
    path('leases/confirm/', confirm_lease, name='confirm-lease'),
    path('leases/', LeaseListView.as_view(), name='lease-list'),
    
    # Reviews
    path('create/', create_review, name='create-review'),
    path('property/<int:property_id>/', PropertyReviewsView.as_view(), name='property-reviews'),
    path('landlord/<int:landlord_id>/', LandlordReviewsView.as_view(), name='landlord-reviews'),
]
