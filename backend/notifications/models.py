from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    """
    Notifications for users about various events.
    """
    
    class NotificationType(models.TextChoices):
        NEW_MESSAGE = 'NEW_MESSAGE', 'New Message'
        PROPERTY_UPDATE = 'PROPERTY_UPDATE', 'Property Update'
        REVIEW_POSTED = 'REVIEW_POSTED', 'Review Posted'
        LEASE_CONFIRMED = 'LEASE_CONFIRMED', 'Lease Confirmed'
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_notifications',
        null=True,
        blank=True,
        help_text="User who triggered this notification (message sender or property owner)"
    )
    type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    # Optional related objects
    related_property_id = models.IntegerField(null=True, blank=True)
    related_chat_id = models.IntegerField(null=True, blank=True)
    related_review_id = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
