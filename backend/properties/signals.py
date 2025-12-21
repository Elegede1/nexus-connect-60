from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Property, SavedProperty
from notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(pre_save, sender=Property)
def capture_old_price(sender, instance, **kwargs):
    """Capture the old price before saving changes."""
    if instance.pk:
        try:
            old_instance = Property.objects.get(pk=instance.pk)
            instance._old_price = old_instance.price
        except Property.DoesNotExist:
            instance._old_price = None
    else:
        instance._old_price = None

@receiver(post_save, sender=Property)
def notify_price_change(sender, instance, created, **kwargs):
    """
    Check if price changed and notify tenants who saved this property.
    """
    if created:
        return

    # Check if we captured an old price
    if not hasattr(instance, '_old_price') or instance._old_price is None:
        return

    if instance.price != instance._old_price:
        # Find all tenants who saved this property
        saved_properties = SavedProperty.objects.filter(property=instance).select_related('tenant')
        
        notifications = []
        for sp in saved_properties:
            notifications.append(
                Notification(
                    user=sp.tenant,
                    type=Notification.NotificationType.PROPERTY_UPDATE,
                    title="Price Update Alert",
                    message=f"The price for '{instance.title}' has changed from ₦{instance._old_price:,.2f} to ₦{instance.price:,.2f}.",
                    related_property_id=instance.id
                )
            )
        
        # Bulk create for efficiency
        if notifications:
            Notification.objects.bulk_create(notifications)


@receiver(post_save, sender=Property)
def notify_followers_on_property_activity(sender, instance, created, **kwargs):
    """
    Notify landlord's followers when they upload a new property or update an existing one.
    """
    from accounts.models import Follow

    landlord = instance.landlord
    followers = Follow.objects.filter(following=landlord).select_related('follower')
    
    if not followers.exists():
        return

    notifications = []
    
    if created:
        # New Property Notification
        title = "New Property Alert"
        message = f"{landlord.first_name} {landlord.last_name} has uploaded a new property: '{instance.title}'."
    else:
        # Property Edited Notification
        # Avoid duplicate notifications if price change already triggered one? 
        # Ideally price change is specific to SAVED users. This is for FOLLOWERS.
        # A follower might not have saved this property yet.
        title = "Property Updated"
        message = f"{landlord.first_name} {landlord.last_name} has updated the property: '{instance.title}'."

    for follow in followers:
        notifications.append(
            Notification(
                user=follow.follower,
                type=Notification.NotificationType.PROPERTY_UPDATE, # Or create a new type if needed, but this works
                title=title,
                message=message,
                related_property_id=instance.id
            )
        )
    
    if notifications:
        Notification.objects.bulk_create(notifications)
