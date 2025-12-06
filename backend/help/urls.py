from django.urls import path
from .views import PropertyTypeHelpListView

app_name = 'help'

urlpatterns = [
    path('property-types/', PropertyTypeHelpListView.as_view(), name='property-type-help'),
]
