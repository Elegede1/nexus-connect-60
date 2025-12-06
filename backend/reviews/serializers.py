from rest_framework import serializers
from .models import LeaseConfirmation, Review
from accounts.serializers import UserSerializer
from properties.serializers import PropertyListSerializer


class LeaseConfirmationSerializer(serializers.ModelSerializer):
    """Serializer for lease confirmations"""
    
    property = PropertyListSerializer(read_only=True)
    tenant = UserSerializer(read_only=True)
    has_review = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaseConfirmation
        fields = ['id', 'property', 'landlord', 'tenant', 'notes', 'confirmed_at', 'has_review']
        read_only_fields = ['id', 'landlord', 'confirmed_at']
    
    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class LeaseConfirmationCreateSerializer(serializers.Serializer):
    """Serializer for creating lease confirmation"""
    
    property_id = serializers.IntegerField()
    tenant_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews"""
    
    tenant = UserSerializer(read_only=True)
    property = PropertyListSerializer(read_only=True)
    landlord = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'property', 'landlord', 'tenant',
            'rating', 'comment', 'is_public',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'property', 'landlord', 'tenant', 'created_at', 'updated_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a review"""
    
    lease_confirmation_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Review
        fields = ['lease_confirmation_id', 'rating', 'comment', 'is_public']
    
    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
