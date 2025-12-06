from django.contrib import admin
from .models import Property, PropertyImage, SavedProperty


class PropertyImageInline(admin.TabularInline):
    """Inline admin for property images"""
    model = PropertyImage
    extra = 1
    fields = ['image_url', 'is_cover', 'order']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    """Admin interface for Property"""
    
    list_display = ['title', 'landlord', 'property_type', 'price', 'location', 'is_premium', 'view_count', 'save_count', 'created_at']
    list_filter = ['property_type', 'is_premium', 'num_bedrooms', 'num_bathrooms', 'created_at']
    search_fields = ['title', 'description', 'location', 'landlord__email']
    ordering = ['-is_premium', '-created_at']
    inlines = [PropertyImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('landlord', 'title', 'description', 'price')
        }),
        ('Location', {
            'fields': ('location', 'zip_code', 'latitude', 'longitude')
        }),
        ('Property Details', {
            'fields': ('property_type', 'num_bedrooms', 'num_bathrooms', 'amenities')
        }),
        ('Features', {
            'fields': ('is_premium',)
        }),
        ('Analytics', {
            'fields': ('view_count', 'save_count'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['view_count', 'save_count']


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    """Admin interface for PropertyImage"""
    
    list_display = ['property', 'is_cover', 'order', 'uploaded_at']
    list_filter = ['is_cover', 'uploaded_at']
    search_fields = ['property__title']
    ordering = ['property', 'order']


@admin.register(SavedProperty)
class SavedPropertyAdmin(admin.ModelAdmin):
    """Admin interface for SavedProperty"""
    
    list_display = ['tenant', 'property', 'saved_at']
    list_filter = ['saved_at']
    search_fields = ['tenant__email', 'property__title']
    ordering = ['-saved_at']
