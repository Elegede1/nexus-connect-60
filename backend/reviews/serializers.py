from rest_framework import serializers
from .models import Review
from accounts.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Review model.
    """
    tenant_name = serializers.ReadOnlyField(source='tenant.first_name')
    tenant_avatar = serializers.ReadOnlyField(source='tenant.avatar')
    
    class Meta:
        model = Review
        fields = ['id', 'landlord', 'property', 'tenant', 'tenant_name', 'tenant_avatar', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'tenant', 'created_at']

    def create(self, validated_data):
        # Ensure tenant is set to current user
        validated_data['tenant'] = self.context['request'].user
        return super().create(validated_data)
