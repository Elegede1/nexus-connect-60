from django.db import models


class PropertyTypeHelp(models.Model):
    """
    Admin-managed help content for property types.
    Displayed on the property help page.
    """
    
    PROPERTY_TYPES = [
        ('APARTMENT', 'Apartment'),
        ('HOUSE', 'House'),
        ('CONDO', 'Condo'),
        ('TOWNHOUSE', 'Townhouse'),
    ]
    
    property_type = models.CharField(
        max_length=20,
        choices=PROPERTY_TYPES,
        unique=True,
        help_text="Property type"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="Brief description")
    image_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="Optional image URL"
    )
    content = models.TextField(
        help_text="Detailed content (supports HTML)"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (lower numbers first)"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'property_type']
        verbose_name = 'Property Type Help'
        verbose_name_plural = 'Property Type Help Pages'
    
    def __str__(self):
        return self.title
