from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('rooms/', views.ChatRoomListView.as_view(), name='room-list'),
    path('rooms/create/', views.create_or_get_chat_room, name='room-create'),
    path('rooms/<int:room_id>/messages/', views.ChatMessageListView.as_view(), name='message-list'),
    path('messages/<int:pk>/', views.ChatMessageDetailView.as_view(), name='message-detail'),
    path('rooms/<int:room_id>/messages/send/', views.send_message, name='send-message'),
    path('rooms/<int:room_id>/mark-read/', views.mark_messages_read, name='mark-read'),
    path('unread-count/', views.unread_count, name='unread-count'),
]
