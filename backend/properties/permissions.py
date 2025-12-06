from rest_framework import permissions


class IsLandlordOrReadOnly(permissions.BasePermission):
    """
    Only landlords can create properties.
    Everyone can read.
    """
    
    def has_permission(self, request, view):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for landlords
        return request.user.is_authenticated and request.user.is_landlord()


class IsPropertyOwner(permissions.BasePermission):
    """
    Only property owner can update/delete.
    Everyone can read.
    """
    
    def has_permission(self, request, view):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions require authentication
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for property owner
        return obj.landlord == request.user
