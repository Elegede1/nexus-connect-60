from rest_framework import serializers
from django.db import models
from .models import Property, PropertyImage, PropertyVideo, SavedProperty
from accounts.serializers import UserSerializer
import json


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images"""
    
    class Meta:
        model = PropertyImage
        fields = ['id', 'image_url', 'is_cover', 'order', 'uploaded_at']
class PropertyVideoSerializer(serializers.ModelSerializer):
    """Serializer for property videos"""
    
    class Meta:
        model = PropertyVideo
        fields = ['id', 'video_url', 'created_at']
        read_only_fields = ['id', 'created_at']




class PropertyListSerializer(serializers.ModelSerializer):
    """Condensed property serializer for list/search views"""
    
    landlord_name = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()        
    amenities_list = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'price', 'location', 'state', 'city', 'property_type',
            'num_bedrooms', 'num_bathrooms', 'num_toilets', 'is_premium',
            'cover_image', 'landlord_name', 'amenities_list',
            'view_count', 'save_count', 'review_count', 'average_rating', 'created_at'
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

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_average_rating(self, obj):
        from django.db.models import Avg
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0


class PropertyDetailSerializer(serializers.ModelSerializer):
    """Full property details including all images and landlord info"""
    
    landlord = UserSerializer(read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    videos = PropertyVideoSerializer(many=True, read_only=True)
    amenities_list = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'landlord', 'title', 'description', 'price',
            'location', 'state', 'city', 'zip_code', 'latitude', 'longitude',
            'property_type', 'num_bedrooms', 'num_bathrooms', 'num_toilets',
            'amenities_list', 'is_premium', 'images', 'videos',
            'view_count', 'save_count', 'is_saved', 'review_count', 'average_rating',
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

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_average_rating(self, obj):
        from django.db.models import Avg
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating properties with file uploads"""
    
    amenities_list = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True,
        help_text="List of custom amenity tags"
    )
    image_files = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
        help_text="List of image files to upload (min 5)"
    )
    video_files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
        help_text="List of video files to upload (min 1)"
    )
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price', 'location', 'state', 'city', 'zip_code',
            'latitude', 'longitude', 'property_type', 'num_bedrooms',
            'num_bathrooms', 'num_toilets', 'amenities_list', 'is_premium', 'image_files', 'video_files'
        ]
        read_only_fields = ['id']
        
    def validate(self, attrs):
        """
        Only validate minimum media counts on creation, not on update.
        On update, existing media counts toward the minimum.
        """
        # Check if this is a create operation (no instance)
        if self.instance is None:
            image_files = attrs.get('image_files', [])
            video_files = attrs.get('video_files', [])
            
            if len(image_files) < 5:
                raise serializers.ValidationError({"image_files": "At least 5 images are required."})
            if len(video_files) < 1:
                raise serializers.ValidationError({"video_files": "At least 1 video is required."})
        
        return attrs
    
    def create(self, validated_data):
        from .storage import upload_file
        
        amenities_list = validated_data.pop('amenities_list', [])
        image_files = validated_data.pop('image_files', [])
        video_files = validated_data.pop('video_files', [])
        
        # Set landlord to current user
        validated_data['landlord'] = self.context['request'].user
        
        # Convert amenities list to JSON
        if amenities_list:
            validated_data['amenities'] = json.dumps(amenities_list)
        
        property_obj = Property.objects.create(**validated_data)
        
        # Process Image Uploads
        for idx, file in enumerate(image_files):
            try:
                # Upload to Supabase
                url = upload_file(file, 'property-images', folder=f"properties/{property_obj.id}/images")
                
                PropertyImage.objects.create(
                    property=property_obj,
                    image_url=url,
                    is_cover=(idx == 0),  # First image is cover
                    order=idx
                )
            except Exception as e:
                # In a real app, might want to rollback or log error
                print(f"Error uploading image {idx}: {str(e)}")
            
        # Process Video Uploads
        for idx, file in enumerate(video_files):
            try:
                # Upload to Supabase
                url = upload_file(file, 'property-videos', folder=f"properties/{property_obj.id}/videos")
                
                PropertyVideo.objects.create(
                    property=property_obj,
                    video_url=url
                )
            except Exception as e:
                print(f"Error uploading video {idx}: {str(e)}")
        
        return property_obj
    
    def update(self, instance, validated_data):
        from .storage import upload_file
        
        amenities_list = validated_data.pop('amenities_list', None)
        image_files = validated_data.pop('image_files', None)
        video_files = validated_data.pop('video_files', None)
        
        # Update amenities if provided
        if amenities_list is not None:
            instance.amenities = json.dumps(amenities_list)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # APPEND new images (instead of replacing all)
        if image_files is not None and len(image_files) > 0:
            # Get the current max order to continue from
            existing_images = instance.images.all()
            max_order = existing_images.aggregate(models.Max('order'))['order__max'] or -1
            has_cover = existing_images.filter(is_cover=True).exists()
            
            for idx, file in enumerate(image_files):
                try:
                    url = upload_file(file, 'property-images', folder=f"properties/{instance.id}/images")
                    PropertyImage.objects.create(
                        property=instance,
                        image_url=url,
                        is_cover=(not has_cover and idx == 0),  # Only set cover if none exists
                        order=max_order + 1 + idx
                    )
                except Exception as e:
                    print(f"Error uploading image {idx}: {str(e)}")
                
        # APPEND new videos (instead of replacing all)
        if video_files is not None and len(video_files) > 0:
            for idx, file in enumerate(video_files):
                try:
                    url = upload_file(file, 'property-videos', folder=f"properties/{instance.id}/videos")
                    PropertyVideo.objects.create(
                        property=instance,
                        video_url=url
                    )
                except Exception as e:
                    print(f"Error uploading video {idx}: {str(e)}")
        
        return instance


class SavedPropertySerializer(serializers.ModelSerializer):
    """Serializer for saved properties"""
    
    property = PropertyListSerializer(read_only=True)
    
    class Meta:
        model = SavedProperty
        fields = ['id', 'property', 'saved_at']
        read_only_fields = ['id', 'saved_at']
