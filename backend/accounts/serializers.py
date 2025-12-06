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
            'role', 'phone_number', 'first_name', 'last_name'
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
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'role', 'first_name', 'last_name',
            'phone_number', 'avatar', 'email_notifications', 'push_notifications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'created_at', 'updated_at']


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
        }
        
        return data
