from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    Custom user model with role-based access (Landlord vs Tenant).
    Role is selected at signup and is immutable.
    """
    
    class UserRole(models.TextChoices):
        LANDLORD = 'LANDLORD', 'Landlord'
        TENANT = 'TENANT', 'Tenant'
    
    role = models.CharField(
        max_length=10,
        choices=UserRole.choices,
        help_text="User role: Landlord or Tenant. Cannot be changed after creation."
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)
    cover_photo = models.URLField(max_length=500, blank=True, null=True)
    bio = models.TextField(blank=True, null=True, help_text="Short bio or tagline for the user profile")
    email_notifications = models.BooleanField(
        default=True,
        help_text="Receive email notifications"
    )
    push_notifications = models.BooleanField(
        default=True,
        help_text="Receive push notifications"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Override email to be required
    email = models.EmailField(unique=True)
    
    # Use email as the primary identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
    
    def is_landlord(self):
        """Check if user is a landlord"""
        return self.role == self.UserRole.LANDLORD
    
    def is_tenant(self):
        """Check if user is a tenant"""
        return self.role == self.UserRole.TENANT
    
    def save(self, *args, **kwargs):
        """Override save to prevent role changes after creation"""
        if self.pk is not None:
            # User already exists, check if role is being changed
            original = CustomUser.objects.get(pk=self.pk)
            if original.role != self.role:
                raise ValueError("User role cannot be changed after creation")
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']


class Follow(models.Model):
    """
    Model to track user following relationships.
    Tenants can follow Landlords.
    """
    follower = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='following',
        help_text="The user (Tenant) who follows"
    )
    following = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='followers',
        help_text="The user (Landlord) being followed"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"
