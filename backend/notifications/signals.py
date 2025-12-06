from django.db.models.signals import post_save
from django.dispatch import receiver
from chat.models import Message
from reviews.models import Review, LeaseConfirmation
from properties.models import Property
from .models import Notification


@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """Create notification for new messages"""
    if created:
        # Notify the recipient (not the sender)
        room = instance.room
        recipient = room.landlord if instance.sender == room.tenant else room.tenant
        
        if recipient.push_notifications or recipient.email_notifications:
            Notification.objects.create(
                user=recipient,
                type=Notification.NotificationType.NEW_MESSAGE,
                title='New Message',
                message=f'You have a new message from {instance.sender.username}',
                related_chat_id=room.id
            )


@receiver(post_save, sender=Property)
def create_property_update_notification(sender, instance, created, **kwargs):
    """Create notification for property updates (not for creation)"""
    if not created:
        # Notify users who saved this property
        from properties.models import SavedProperty
        saved_by = SavedProperty.objects.filter(property=instance).select_related('tenant')
        
        for saved in saved_by:
            if saved.tenant.push_notifications or saved.tenant.email_notifications:
                Notification.objects.create(
                    user=saved.tenant,
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
                message=f'You received a new review from {instance.tenant.username}',
                related_review_id=instance.id,
                related_property_id=instance.property.id
            )


@receiver(post_save, sender=LeaseConfirmation)
def create_lease_confirmation_notification(sender, instance, created, **kwargs):
    """Create notification when a lease is confirmed"""
    if created:
        # Notify the tenant
        if instance.tenant.push_notifications or instance.tenant.email_notifications:
            Notification.objects.create(
                user=instance.tenant,
                type=Notification.NotificationType.LEASE_CONFIRMED,
                title='Lease Confirmed',
                message=f'Your lease for {instance.property.title} has been confirmed',
                related_property_id=instance.property.id
            )
