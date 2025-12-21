"""
Local file storage for development.
Saves media files to Django's MEDIA_ROOT folder.
"""
import os
import uuid
from django.conf import settings


def upload_file_local(file, folder="uploads"):
    """
    Save a file to local media storage.
    
    Args:
        file: File object to save (Django UploadedFile)
        folder: Folder path within MEDIA_ROOT
    
    Returns:
        str: URL path to the saved file (relative to MEDIA_URL)
    """
    # Generate unique filename
    ext = 'bin'
    if hasattr(file, 'name') and file.name:
        ext = file.name.split('.')[-1]
    
    filename = f"{uuid.uuid4()}.{ext}"
    
    # Create folder path
    folder_path = os.path.join(settings.MEDIA_ROOT, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # Full file path
    file_path = os.path.join(folder_path, filename)
    
    # Save file
    with open(file_path, 'wb+') as destination:
        if hasattr(file, 'chunks'):
            for chunk in file.chunks():
                destination.write(chunk)
        else:
            file.seek(0)
            destination.write(file.read())
    
    # Return URL (relative path that Django's MEDIA_URL will serve)
    relative_path = f"{folder}/{filename}"
    
    # Build full URL for frontend
    # In development, this will be something like http://localhost:8000/media/...
    base_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
    full_url = f"{base_url}{settings.MEDIA_URL}{relative_path}"
    
    return full_url


def delete_file_local(file_url):
    """
    Delete a file from local storage using its URL.
    """
    try:
        # Extract relative path from URL
        if settings.MEDIA_URL in file_url:
            relative_path = file_url.split(settings.MEDIA_URL)[-1]
            file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        return False
    except Exception as e:
        print(f"Failed to delete local file: {str(e)}")
        return False
