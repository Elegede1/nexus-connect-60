from rest_framework import serializers
from .models import PropertyTypeHelp


class PropertyTypeHelpSerializer(serializers.ModelSerializer):
    """Serializer for property type help pages"""
    
    class Meta:
        model = PropertyTypeHelp
        fields = [
            'id', 'property_type', 'title', 'description',
            'image_url', 'content', 'order'
        ]
