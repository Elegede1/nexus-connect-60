from django.db import models
from django.contrib.auth import get_user_model
from properties.models import Property

User = get_user_model()


class ChatRoom(models.Model):
    """
    Chat room between a landlord and tenant for a specific property.
    One room per landlord-tenant-property combination.
    """
    
    landlord = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='landlord_chat_rooms',
        limit_choices_to={'role': 'LANDLORD'}
    )
    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tenant_chat_rooms',
        limit_choices_to={'role': 'TENANT'}
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='chat_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['landlord', 'tenant', 'property']
        ordering = ['-updated_at']
        verbose_name = 'Chat Room'
        verbose_name_plural = 'Chat Rooms'
    
    def __str__(self):
        return f"Chat: {self.tenant.email} - {self.landlord.email} ({self.property.title})"
    
    def get_unread_count(self, user):
        """Get unread message count for a specific user"""
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    """
    Individual chat message within a chat room.
    """
    
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies'
    )
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
    
    def __str__(self):
        return f"{self.sender.email}: {self.content[:50]}"
