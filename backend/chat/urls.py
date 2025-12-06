from django.urls import path
from .views import (
    ChatRoomListView,
    ChatMessageListView,
    create_or_get_chat_room,
    mark_messages_read
)

app_name = 'chat'

urlpatterns = [
    path('rooms/', ChatRoomListView.as_view(), name='room-list'),
    path('rooms/create/', create_or_get_chat_room, name='room-create'),
    path('rooms/<int:room_id>/messages/', ChatMessageListView.as_view(), name='message-list'),
    path('rooms/<int:room_id>/mark-read/', mark_messages_read, name='mark-read'),
]
