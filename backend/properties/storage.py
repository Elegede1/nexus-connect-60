"""
Storage module for file uploads.
Uses local storage in DEBUG mode, Supabase Storage in production.
"""
from django.conf import settings
import uuid
import mimetypes


def get_supabase_client():
    """Initialize and return Supabase client (for production use)"""
    from supabase import create_client
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)



def upload_file(file, bucket_name, folder="properties", filename=None):
    """
    Upload a file to storage.
    
    In DEBUG mode, saves to local media folder.
    In production, uploads to Supabase Storage.
    
    Args:
        file: File object to upload (Django UploadedFile)
        bucket_name: Name of the bucket (used for Supabase; ignored for local)
        folder: Folder path within the storage
        filename: Optional custom filename
    
    Returns:
        str: Public URL of uploaded file
    
    Raises:
        Exception: If upload fails
    """
    # Use local storage for development
    if settings.DEBUG:
        from .local_storage import upload_file_local
        return upload_file_local(file, folder=folder)
    
    # Production: Use Supabase
    try:
        supabase = get_supabase_client()
        
        # Generate unique filename if not provided
        if not filename:
            # Try to guess extension from content type or name
            ext = 'bin'
            if hasattr(file, 'name'):
                ext = file.name.split('.')[-1]
            elif hasattr(file, 'content_type'):
                ext = mimetypes.guess_extension(file.content_type).strip('.')
            
            filename = f"{uuid.uuid4()}.{ext}"
        
        # storage path: folder/filename
        path = f"{folder}/{filename}"
        
        # Read file content
        # Django UploadedFile has .read(), but sometimes we need to ensure we are at start
        if hasattr(file, 'seek'):
            file.seek(0)
        file_content = file.read()
        
        # Upload options - upsert allows replacing existing files
        file_options = {"upsert": "true"}
        if hasattr(file, 'content_type'):
            file_options["content-type"] = file.content_type

        # Upload to Supabase Storage
        response = supabase.storage.from_(bucket_name).upload(
            path,
            file_content,
            file_options=file_options
        )
        
        # Get public URL
        # Note: get_public_url returns a string URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(path)
        
        return public_url
        
    except Exception as e:
        # Log the error properly in production
        print(f"Supabase Upload Error: {str(e)}")
        raise Exception(f"Failed to upload to Supabase: {str(e)}")


def delete_file(file_url, bucket_name):
    """
    Delete file from Supabase Storage using its public URL.
    """
    try:
        supabase = get_supabase_client()
        
        # Attempt to extract path from URL
        # URL format usually: .../storage/v1/object/public/[bucket_name]/[path]
        # We need check if the URL contains the bucket name part
        
        # A simple robust way is to split by bucket name
        if bucket_name in file_url:
            path = file_url.split(f"/{bucket_name}/")[-1]
        else:
            # Fallback or error?
            return False
        
        supabase.storage.from_(bucket_name).remove([path])
        return True
        
    except Exception as e:
        print(f"Failed to delete from Supabase: {str(e)}")
        return False
