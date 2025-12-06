from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """Admin interface for CustomUser"""
    
    list_display = ['email', 'username', 'role', 'is_staff', 'created_at']
    list_filter = ['role', 'is_staff', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'phone_number']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Preferences', {
            'fields': ('role', 'phone_number', 'avatar', 'email_notifications', 'push_notifications')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role & Preferences', {
            'fields': ('role', 'email', 'phone_number')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def get_readonly_fields(self, request, obj=None):
        """Make role readonly for existing users"""
        if obj:  # Editing an existing object
            return self.readonly_fields + ['role']
        return self.readonly_fields
