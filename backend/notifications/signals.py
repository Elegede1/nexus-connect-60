from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from chat.models import Message
from reviews.models import Review
from properties.models import Property
from .models import Notification


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """Create notification for new messages with hour-based deduplication"""
    if created:
        # Notify the recipient (not the sender)
        room = instance.room
        recipient = room.landlord if instance.sender == room.tenant else room.tenant
        
        if recipient.push_notifications or recipient.email_notifications:
            # Calculate one hour ago
            one_hour_ago = timezone.now() - timedelta(hours=1)
            
            # Delete notifications from same sender within the last hour
            Notification.objects.filter(
                user=recipient,
                sender=instance.sender,
                type=Notification.NotificationType.NEW_MESSAGE,
                created_at__gte=one_hour_ago
            ).delete()

            Notification.objects.create(
                user=recipient,
                sender=instance.sender,
                type=Notification.NotificationType.NEW_MESSAGE,
                title='New Message',
                message=f'You have a new message from {instance.sender.username}',
                related_chat_id=room.id
            )


@receiver(post_save, sender=Property)
def create_property_update_notification(sender, instance, created, **kwargs):
    """Create notification for property updates with hour-based deduplication"""
    if not created:
        # Notify users who saved this property
        from properties.models import SavedProperty
        saved_by = SavedProperty.objects.filter(property=instance).select_related('tenant')
        
        # Calculate one hour ago
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        for saved in saved_by:
            if saved.tenant.push_notifications or saved.tenant.email_notifications:
                # Delete property update notifications from same landlord within last hour
                Notification.objects.filter(
                    user=saved.tenant,
                    sender=instance.landlord,
                    type=Notification.NotificationType.PROPERTY_UPDATE,
                    created_at__gte=one_hour_ago
                ).delete()

                Notification.objects.create(
                    user=saved.tenant,
                    sender=instance.landlord,
                    type=Notification.NotificationType.PROPERTY_UPDATE,
                    title='Property Updated',
                    message=f'A property you saved has been updated: {instance.title}',
                    related_property_id=instance.id
                )


@receiver(post_save, sender=Review)
def create_review_notification(sender, instance, created, **kwargs):
    """Create notification when a review is posted"""
    if created:
        # Notify the landlord
        if instance.landlord.push_notifications or instance.landlord.email_notifications:
            Notification.objects.create(
                user=instance.landlord,
                type=Notification.NotificationType.REVIEW_POSTED,
                title='New Review',
                message=f'You received a new review from {instance.tenant.first_name}',
                related_review_id=instance.id
            )
