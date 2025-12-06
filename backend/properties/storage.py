"""
Supabase Storage integration for property image uploads.
"""
from supabase import create_client, Client
from django.conf import settings
import uuid


def get_supabase_client() -> Client:
    """Initialize and return Supabase client"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def upload_property_image(file, property_id, filename=None):
    """
    Upload property image to Supabase Storage.
    
    Args:
        file: File object to upload
        property_id: Property ID for organizing files
        filename: Optional custom filename
    
    Returns:
        str: Public URL of uploaded image
    
    Raises:
        Exception: If upload fails
    """
    try:
        supabase = get_supabase_client()
        
        # Generate unique filename
        if not filename:
            ext = file.name.split('.')[-1] if hasattr(file, 'name') else 'jpg'
            filename = f"{uuid.uuid4()}.{ext}"
        
        # Organize by property ID
        path = f"properties/{property_id}/{filename}"
        
        # Upload to Supabase Storage
        # Read file content
        file_content = file.read()
        
        # Upload to 'property-images' bucket
        response = supabase.storage.from_('property-images').upload(
            path,
            file_content,
            file_options={"content-type": file.content_type if hasattr(file, 'content_type') else 'image/jpeg'}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('property-images').get_public_url(path)
        
        return public_url
        
    except Exception as e:
        raise Exception(f"Failed to upload image to Supabase: {str(e)}")


def delete_property_image(image_url):
    """
    Delete property image from Supabase Storage.
    
    Args:
        image_url: Public URL of the image to delete
    
    Returns:
        bool: True if successful
    """
    try:
        supabase = get_supabase_client()
        
        # Extract path from URL
        # URL format: https://[project].supabase.co/storage/v1/object/public/property-images/[path]
        path = image_url.split('/property-images/')[-1]
        
        # Delete from bucket
        supabase.storage.from_('property-images').remove([path])
        
        return True
        
    except Exception as e:
        print(f"Failed to delete image from Supabase: {str(e)}")
        return False
