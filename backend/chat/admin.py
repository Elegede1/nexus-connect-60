from django.contrib import admin
from .models import ChatRoom, Message


class MessageInline(admin.TabularInline):
    """Inline admin for messages"""
    model = Message
    extra = 0
    fields = ['sender', 'content', 'is_read', 'timestamp']
    readonly_fields = ['timestamp']
    can_delete = False


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    """Admin interface for ChatRoom"""
    
    list_display = ['id', 'landlord', 'tenant', 'property', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['landlord__email', 'tenant__email', 'property__title']
    ordering = ['-updated_at']
    inlines = [MessageInline]
    
    def has_add_permission(self, request):
        return False


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin interface for Message"""
    
    list_display = ['id', 'room', 'sender', 'content_preview', 'is_read', 'timestamp']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['sender__email', 'content']
    ordering = ['-timestamp']
    
    def content_preview(self, obj):
        return obj.content[:50]
    content_preview.short_description = 'Content'
    
    def has_add_permission(self, request):
        return False
