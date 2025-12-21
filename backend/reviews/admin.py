from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin interface for Review"""
    list_display = ['id', 'landlord', 'tenant', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['landlord__email', 'landlord__first_name', 'tenant__email', 'comment']
    ordering = ['-created_at']
