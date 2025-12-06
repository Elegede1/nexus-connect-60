from django.contrib import admin
from .models import LeaseConfirmation, Review


@admin.register(LeaseConfirmation)
class LeaseConfirmationAdmin(admin.ModelAdmin):
    """Admin interface for LeaseConfirmation"""
    
    list_display = ['id', 'property', 'landlord', 'tenant', 'confirmed_at']
    list_filter = ['confirmed_at']
    search_fields = ['property__title', 'landlord__email', 'tenant__email']
    ordering = ['-confirmed_at']
    
    fieldsets = (
        ('Lease Details', {
            'fields': ('property', 'landlord', 'tenant', 'notes')
        }),
        ('Timestamps', {
            'fields': ('confirmed_at',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['confirmed_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin interface for Review"""
    
    list_display = ['id', 'property', 'tenant', 'landlord', 'rating', 'is_public', 'created_at']
    list_filter = ['rating', 'is_public', 'created_at']
    search_fields = ['property__title', 'tenant__email', 'landlord__email', 'comment']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Review Details', {
            'fields': ('lease_confirmation', 'property', 'landlord', 'tenant')
        }),
        ('Review Content', {
            'fields': ('rating', 'comment', 'is_public')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['lease_confirmation', 'property', 'landlord', 'tenant', 'created_at', 'updated_at']
