from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with role selection"""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'password', 'password_confirm',
            'role', 'phone_number', 'first_name', 'last_name', 'avatar'
        ]
        extra_kwargs = {
            'role': {'required': True},
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs
    
    def validate_role(self, value):
        """Validate role is one of the allowed choices"""
        if value not in [User.UserRole.LANDLORD, User.UserRole.TENANT]:
            raise serializers.ValidationError("Invalid role. Must be 'LANDLORD' or 'TENANT'")
        return value
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    properties = serializers.SerializerMethodField()
    
    avatar = serializers.URLField(read_only=True)
    cover_photo = serializers.URLField(read_only=True)
    
    # Adding write-only file fields for uploads
    avatar_file = serializers.ImageField(write_only=True, required=False)
    cover_file = serializers.ImageField(write_only=True, required=False)
    
    followers_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'role', 'first_name', 'last_name',
            'phone_number', 'avatar', 'cover_photo', 'bio', 'email_notifications', 'push_notifications',
            'created_at', 'updated_at', 'properties', 'avatar_file', 'cover_file',
            'followers_count'
        ]
        read_only_fields = ['id', 'email', 'role', 'created_at', 'updated_at', 'followers_count']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_properties(self, obj):
        if obj.role != User.UserRole.LANDLORD:
            return []
        # Lazy import to avoid circular dependency
        from properties.serializers import PropertyListSerializer
        return PropertyListSerializer(obj.properties.all(), many=True).data

    def update(self, instance, validated_data):
        from properties.storage import upload_file
        import logging
        logger = logging.getLogger(__name__)
        
        avatar_file = validated_data.pop('avatar_file', None)
        cover_file = validated_data.pop('cover_file', None)
        
        # Update other fields first
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if avatar_file:
            try:
                logger.info(f"Uploading avatar for user {instance.id}: {avatar_file.name}")
                # Using 'property-images' bucket as it's confirmed to work/exist
                # folder structure: users/<id>/avatar
                url = upload_file(avatar_file, 'property-images', folder=f"users/{instance.id}/avatar")
                logger.info(f"Avatar uploaded successfully: {url}")
                instance.avatar = url
            except Exception as e:
                logger.error(f"Error uploading avatar: {str(e)}")
                print(f"Error uploading avatar: {str(e)}")

        if cover_file:
            try:
                logger.info(f"Uploading cover for user {instance.id}: {cover_file.name}")
                url = upload_file(cover_file, 'property-images', folder=f"users/{instance.id}/cover")
                logger.info(f"Cover uploaded successfully: {url}")
                instance.cover_photo = url
            except Exception as e:
                logger.error(f"Error uploading cover: {str(e)}")
                print(f"Error uploading cover: {str(e)}")
        
        instance.save()
        return instance


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    
    class Meta:
        model = User
        fields = ['email_notifications', 'push_notifications']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer to include user info in token response"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add custom claims
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'avatar': self.user.avatar,
            'cover_photo': self.user.cover_photo,
        }
        
        return data
