from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import ChatRoom, Message
from properties.models import Property
from .serializers import (
    ChatRoomSerializer,
    ChatRoomCreateSerializer,
    MessageSerializer
)


class ChatRoomListView(generics.ListAPIView):
    """
    List all chat rooms for the authenticated user.
    Shows rooms where user is either landlord or tenant.
    """
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(landlord=user) | Q(tenant=user)
        ).select_related('landlord', 'tenant', 'property').prefetch_related('messages')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_or_get_chat_room(request):
    """
    Create or get existing chat room for a property.
    Tenants initiate chat with landlord from property listing.
    """
    serializer = ChatRoomCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    property_id = serializer.validated_data['property_id']
    
    # Get property
    try:
        property_obj = Property.objects.select_related('landlord').get(pk=property_id)
    except Property.DoesNotExist:
        return Response(
            {'error': 'Property not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    landlord = property_obj.landlord
    tenant = request.user
    
    # Verify user is a tenant (not landlord chatting with themselves)
    if not tenant.is_tenant():
        return Response(
            {'error': 'Only tenants can initiate chat with landlords'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get or create chat room
    room, created = ChatRoom.objects.get_or_create(
        landlord=landlord,
        tenant=tenant,
        property=property_obj
    )
    
    return Response({
        'room': ChatRoomSerializer(room, context={'request': request}).data,
        'created': created
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ChatMessageListView(generics.ListAPIView):
    """
    List messages for a specific chat room.
    Paginated with oldest first.
    """
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        user = self.request.user
        
        # Verify user has access to this room
        try:
            room = ChatRoom.objects.get(pk=room_id)
            if user != room.landlord and user != room.tenant:
                return Message.objects.none()
        except ChatRoom.DoesNotExist:
            return Message.objects.none()
        
        return Message.objects.filter(room_id=room_id).select_related('sender')


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, room_id):
    """
    Mark all messages in a room as read for the current user.
    """
    user = request.user
    
    try:
        room = ChatRoom.objects.get(pk=room_id)
        
        # Verify user has access
        if user != room.landlord and user != room.tenant:
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark messages as read (only messages not sent by this user)
        Message.objects.filter(
            room=room,
            is_read=False
        ).exclude(sender=user).update(is_read=True)
        
        return Response({'message': 'Messages marked as read'}, status=status.HTTP_200_OK)
        
    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Chat room not found'},
            status=status.HTTP_404_NOT_FOUND
        )
