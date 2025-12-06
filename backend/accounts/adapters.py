"""
Custom django-allauth adapter to handle role selection during social authentication.
"""
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings


class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom adapter for regular account operations"""
    
    def save_user(self, request, user, form, commit=True):
        """Save user with role from form data"""
        user = super().save_user(request, user, form, commit=False)
        
        # Get role from request data (will be set by frontend)
        role = request.data.get('role') or request.POST.get('role')
        if role in ['LANDLORD', 'TENANT']:
            user.role = role
        
        if commit:
            user.save()
        return user


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """Custom adapter for social account operations"""
    
    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a social provider,
        but before the login is actually processed (and before the user is persisted).
        """
        # Role will be stored in session by the frontend before OAuth redirect
        if sociallogin.is_existing:
            return
        
        # Get role from session (set by frontend)
        role = request.session.get('pending_role')
        if not role or role not in ['LANDLORD', 'TENANT']:
            # Default to TENANT if no role specified
            role = 'TENANT'
        
        # Set role on the user object
        if sociallogin.user.id and not sociallogin.user.role:
            sociallogin.user.role = role
            sociallogin.user.save()
    
    def save_user(self, request, sociallogin, form=None):
        """Save social login user with role"""
        user = super().save_user(request, sociallogin, form)
        
        # Get role from session
        role = request.session.get('pending_role')
        if role and role in ['LANDLORD', 'TENANT']:
            user.role = role
            user.save()
            # Clear the pending role from session
            request.session.pop('pending_role', None)
        elif not user.role:
            # Default to TENANT if no role set
            user.role = 'TENANT'
            user.save()
        
        return user
    
    def populate_user(self, request, sociallogin, data):
        """Populate user with data from social provider"""
        user = super().populate_user(request, sociallogin, data)
        
        # Get role from session
        role = request.session.get('pending_role')
        if role and role in ['LANDLORD', 'TENANT']:
            user.role = role
        else:
            user.role = 'TENANT'  # Default
        
        return user
