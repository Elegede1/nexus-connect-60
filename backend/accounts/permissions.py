from rest_framework import permissions

class IsLandlord(permissions.BasePermission):
    """
    Allocates permissions only to users with the LANDLORD role.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_landlord()

class IsTenant(permissions.BasePermission):
    """
    Allocates permissions only to users with the TENANT role.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_tenant()
