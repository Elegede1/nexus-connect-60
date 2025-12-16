from rest_framework import serializers
from .models import Property, PropertyImage, SavedProperty
from accounts.serializers import UserSerializer
import json


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images"""
    
    class Meta:
        model = PropertyImage
        fields = ['id', 'image_url', 'is_cover', 'order', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class PropertyListSerializer(serializers.ModelSerializer):
    """Condensed property serializer for list/search views"""
    
    landlord_name = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()        
    amenities_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'price', 'duration', 'location', 'state', 'city', 'property_type',
            'num_bedrooms', 'num_bathrooms', 'is_premium',
            'cover_image', 'landlord_name', 'amenities_list',
            'view_count', 'save_count', 'created_at'
        ]
    
    def get_landlord_name(self, obj):
        return f"{obj.landlord.first_name} {obj.landlord.last_name}".strip() or obj.landlord.username
    
    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first()
        if cover:
            return cover.image_url
        # Return first image if no cover set
        first_image = obj.images.first()
        return first_image.image_url if first_image else None
    
    def get_amenities_list(self, obj):
        return obj.get_amenities_list()


class PropertyDetailSerializer(serializers.ModelSerializer):
    """Full property details including all images and landlord info"""
    
    landlord = UserSerializer(read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    amenities_list = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'landlord', 'title', 'description', 'price', 'duration',
            'location', 'state', 'city', 'zip_code', 'latitude', 'longitude',
            'property_type', 'num_bedrooms', 'num_bathrooms',
            'amenities_list', 'is_premium', 'images',
            'view_count', 'save_count', 'is_saved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'save_count', 'created_at', 'updated_at']
    
    def get_amenities_list(self, obj):
        return obj.get_amenities_list()
    
    def get_is_saved(self, obj):
        """Check if current user has saved this property"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_tenant():
            return SavedProperty.objects.filter(
                tenant=request.user,
                property=obj
            ).exists()
        return False


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating properties"""
    
    amenities_list = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
        help_text="List of custom amenity tags"
    )
    image_urls = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        write_only=True,
        help_text="List of Supabase Storage URLs for images"
    )
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price', 'duration', 'location', 'state', 'city', 'zip_code',
            'latitude', 'longitude', 'property_type', 'num_bedrooms',
            'num_bathrooms', 'amenities_list', 'is_premium', 'image_urls'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        amenities_list = validated_data.pop('amenities_list', [])
        image_urls = validated_data.pop('image_urls', [])
        
        # Set landlord to current user
        validated_data['landlord'] = self.context['request'].user
        
        # Convert amenities list to JSON
        if amenities_list:
            validated_data['amenities'] = json.dumps(amenities_list)
        
        property_obj = Property.objects.create(**validated_data)
        
        # Create PropertyImage objects
        for idx, url in enumerate(image_urls):
            PropertyImage.objects.create(
                property=property_obj,
                image_url=url,
                is_cover=(idx == 0),  # First image is cover
                order=idx
            )
        
        return property_obj
    
    def update(self, instance, validated_data):
        amenities_list = validated_data.pop('amenities_list', None)
        image_urls = validated_data.pop('image_urls', None)
        
        # Update amenities if provided
        if amenities_list is not None:
            instance.amenities = json.dumps(amenities_list)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update images if provided
        if image_urls is not None:
            # Delete old images
            instance.images.all().delete()
            # Create new images
            for idx, url in enumerate(image_urls):
                PropertyImage.objects.create(
                    property=instance,
                    image_url=url,
                    is_cover=(idx == 0),
                    order=idx
                )
        
        return instance


class SavedPropertySerializer(serializers.ModelSerializer):
    """Serializer for saved properties"""
    
    property = PropertyListSerializer(read_only=True)
    
    class Meta:
        model = SavedProperty
        fields = ['id', 'property', 'saved_at']
        read_only_fields = ['id', 'saved_at']
