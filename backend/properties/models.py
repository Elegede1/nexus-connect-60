from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import json

User = get_user_model()


class Property(models.Model):
    """
    Property listing model with support for Nigerian property types.
    Includes premium advertising flag for featured listings.
    """
    
    PROPERTY_TYPES = [
        ('APARTMENT', 'Apartment'),
        ('HOUSE', 'House'),
        ('CONDO', 'Condo'),
        ('TOWNHOUSE', 'Townhouse'),
    ]
    
    landlord = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='properties',
        limit_choices_to={'role': 'LANDLORD'},
        help_text="Property owner (must be a Landlord)"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Monthly rent in Naira"
    )
    
    # Location fields
    location = models.CharField(max_length=255, help_text="City or address")
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        help_text="For map-based search"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        help_text="For map-based search"
    )
    
    # Property details
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    num_bedrooms = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Number of bedrooms"
    )
    num_bathrooms = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Number of bathrooms/toilets"
    )
    amenities = models.TextField(
        blank=True,
        help_text="JSON array of custom amenity tags"
    )
    
    # Premium features
    is_premium = models.BooleanField(
        default=False,
        help_text="Premium listings are pinned to top with special badge"
    )
    
    # Analytics
    view_count = models.PositiveIntegerField(default=0)
    save_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def increment_views(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def increment_saves(self):
        """Increment save count"""
        self.save_count += 1
        self.save(update_fields=['save_count'])
    
    def decrement_saves(self):
        """Decrement save count"""
        if self.save_count > 0:
            self.save_count -= 1
            self.save(update_fields=['save_count'])
    
    def get_amenities_list(self):
        """Parse amenities JSON to list"""
        if self.amenities:
            try:
                return json.loads(self.amenities)
            except json.JSONDecodeError:
                return []
        return []
    
    def set_amenities_list(self, amenities_list):
        """Set amenities from list"""
        self.amenities = json.dumps(amenities_list)
    
    def __str__(self):
        return f"{self.title} - ₦{self.price:,.2f}/month"
    
    class Meta:
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-is_premium', '-created_at']  # Premium first, then newest


class PropertyImage(models.Model):
    """
    Property images stored in Supabase Storage.
    Supports multiple images per property with ordering and cover image.
    """
    
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image_url = models.URLField(
        max_length=500,
        help_text="Supabase Storage public URL"
    )
    is_cover = models.BooleanField(
        default=False,
        help_text="Mark as cover/primary image"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (lower numbers first)"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for {self.property.title} ({'Cover' if self.is_cover else 'Gallery'})"
    
    class Meta:
        ordering = ['order', 'uploaded_at']
        
    def save(self, *args, **kwargs):
        """Ensure only one cover image per property"""
        if self.is_cover:
            # Unset other cover images for this property
            PropertyImage.objects.filter(
                property=self.property,
                is_cover=True
            ).exclude(pk=self.pk).update(is_cover=False)
        super().save(*args, **kwargs)


class SavedProperty(models.Model):
    """
    Tenant's saved/favorited properties.
    """
    
    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='saved_properties',
        limit_choices_to={'role': 'TENANT'}
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['tenant', 'property']
        ordering = ['-saved_at']
        verbose_name = 'Saved Property'
        verbose_name_plural = 'Saved Properties'
    
    def __str__(self):
        return f"{self.tenant.email} saved {self.property.title}"
