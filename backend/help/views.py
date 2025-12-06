from rest_framework import generics
from .models import PropertyTypeHelp
from .serializers import PropertyTypeHelpSerializer


class PropertyTypeHelpListView(generics.ListAPIView):
    """
    List all active property type help pages.
    Public endpoint - no authentication required.
    """
    queryset = PropertyTypeHelp.objects.filter(is_active=True)
    serializer_class = PropertyTypeHelpSerializer
