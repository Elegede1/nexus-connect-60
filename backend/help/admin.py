from django.contrib import admin
from .models import PropertyTypeHelp


@admin.register(PropertyTypeHelp)
class PropertyTypeHelpAdmin(admin.ModelAdmin):
    """Admin interface for PropertyTypeHelp"""
    
    list_display = ['property_type', 'title', 'order', 'is_active', 'updated_at']
    list_filter = ['property_type', 'is_active']
    search_fields = ['title', 'description', 'content']
    ordering = ['order', 'property_type']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('property_type', 'title', 'description', 'image_url')
        }),
        ('Content', {
            'fields': ('content',),
            'classes': ('wide',)
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active')
        }),
    )
