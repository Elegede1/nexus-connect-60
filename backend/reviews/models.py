from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from properties.models import Property

User = get_user_model()


class LeaseConfirmation(models.Model):
    """
    Landlord confirms a lease with a tenant for a property.
    This unlocks the review functionality for the tenant.
    """
    
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='lease_confirmations'
    )
    landlord = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='confirmed_leases_as_landlord',
        limit_choices_to={'role': 'LANDLORD'}
    )
    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='confirmed_leases_as_tenant',
        limit_choices_to={'role': 'TENANT'}
    )
    confirmed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, help_text="Optional notes about the lease")
    
    class Meta:
        unique_together = ['property', 'tenant']
        ordering = ['-confirmed_at']
        verbose_name = 'Lease Confirmation'
        verbose_name_plural = 'Lease Confirmations'
    
    def __str__(self):
        return f"Lease: {self.tenant.email} - {self.property.title}"


class Review(models.Model):
    """
    Tenant reviews a property/landlord after lease confirmation.
    Reviews are public by default.
    """
    
    lease_confirmation = models.OneToOneField(
        LeaseConfirmation,
        on_delete=models.CASCADE,
        related_name='review',
        help_text="One review per lease confirmation"
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    landlord = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        limit_choices_to={'role': 'LANDLORD'}
    )
    tenant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        limit_choices_to={'role': 'TENANT'}
    )
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    comment = models.TextField(help_text="Review comment")
    is_public = models.BooleanField(
        default=True,
        help_text="Public reviews are visible to everyone"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
    
    def __str__(self):
        return f"{self.tenant.email} rated {self.property.title} - {self.rating}/5"
