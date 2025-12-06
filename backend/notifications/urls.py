from django.urls import path
from .views import (
    NotificationListView,
    mark_notification_read,
    mark_all_notifications_read
)

app_name = 'notifications'

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/read/', mark_notification_read, name='mark-read'),
    path('mark-all-read/', mark_all_notifications_read, name='mark-all-read'),
]
