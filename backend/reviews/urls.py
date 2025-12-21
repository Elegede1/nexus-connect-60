from django.urls import path
from .views import CreateReviewView, landlord_reviews, recent_reviews

urlpatterns = [
    path('create/', CreateReviewView.as_view(), name='create-review'),
    path('landlord/<int:landlord_id>/', landlord_reviews, name='landlord-reviews'),
    path('recent/', recent_reviews, name='recent-reviews'),
]
