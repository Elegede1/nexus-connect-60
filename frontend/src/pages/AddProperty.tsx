import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Car, Shield, Droplets, Wifi, Zap, Wind, Tv } from 'lucide-react';
import { NIGERIAN_STATES } from '@/constants/locations';
import { useAuth } from '@/context/AuthContext';

interface MediaFile {
    file: File;
    preview: string;
    id: string;
}

export default function AddProperty() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [images, setImages] = useState<MediaFile[]>([]);
    const [videos, setVideos] = useState<MediaFile[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        state: '',
        city: '',
        location: '', // Full address
        property_type: 'APARTMENT',
        num_bedrooms: '',
        num_bathrooms: '',
        num_toilets: '',
        amenities: [] as string[],
    });

    const [newAmenity, setNewAmenity] = useState('');

    const propertyTypes = [
        { value: 'APARTMENT', label: 'Apartment' },
        { value: 'HOUSE', label: 'House' },
        { value: 'CONDO', label: 'Condo' },
        { value: 'TOWNHOUSE', label: 'Townhouse' },
    ];

    const availableAmenities = [
        { name: 'Parking', icon: Car },
        { name: 'Security', icon: Shield },
        { name: 'Water Supply', icon: Droplets },
        { name: 'Internet/WiFi', icon: Wifi },
        { name: 'Backup Power', icon: Zap },
        { name: 'Air Conditioning', icon: Wind },
        { name: 'Cable TV', icon: Tv },
    ];

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            images.forEach(img => URL.revokeObjectURL(img.preview));
            videos.forEach(vid => URL.revokeObjectURL(vid.preview));
        };
    }, [images, videos]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'state') {
            setFormData(prev => ({ ...prev, city: '' }));
        }
    };


    const toggleAmenity = (amenityName: string) => {
        setFormData(prev => {
            const exists = prev.amenities.includes(amenityName);
            if (exists) {
                return { ...prev, amenities: prev.amenities.filter(a => a !== amenityName) };
            } else {
                return { ...prev, amenities: [...prev.amenities, amenityName] };
            }
        });
    };

    const removeAmenity = (amenityToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.filter(a => a !== amenityToRemove)
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        const newImages: MediaFile[] = files.map(file => ({
            file,
            preview: URL.createObjectURL(file), // Generate local preview
            id: Math.random().toString(36).substr(2, 9)
        }));

        setImages(prev => [...prev, ...newImages]);
        e.target.value = ''; // Reset input
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        const newVideos: MediaFile[] = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9)
        }));

        setVideos(prev => [...prev, ...newVideos]);
        e.target.value = ''; // Reset input
    };

    const removeImage = (idToRemove: string) => {
        setImages(prev => {
            const newImages = prev.filter(img => img.id !== idToRemove);
            // Revoke URL of removed image
            const removed = prev.find(img => img.id === idToRemove);
            if (removed) URL.revokeObjectURL(removed.preview);
            return newImages;
        });
    };

    const removeVideo = (idToRemove: string) => {
        setVideos(prev => {
            const newVideos = prev.filter(vid => vid.id !== idToRemove);
            const removed = prev.find(vid => vid.id === idToRemove);
            if (removed) URL.revokeObjectURL(removed.preview);
            return newVideos;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side Validation
        if (images.length < 5) {
            toast({
                title: "More images required",
                description: "Please upload at least 5 images (Rooms, Kitchen, Toilet, Compound, etc.)",
                variant: "destructive"
            });
            return;
        }

        if (videos.length < 1) {
            toast({
                title: "Video required",
                description: "Please upload at least 1 video tour of the property.",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('state', formData.state);
            data.append('city', formData.city);
            data.append('location', formData.location);
            data.append('property_type', formData.property_type);
            data.append('num_bedrooms', formData.num_bedrooms);
            data.append('num_bathrooms', formData.num_bathrooms);
            data.append('num_toilets', formData.num_toilets || '0');
            data.append('is_premium', 'false');

            // Append amenities
            formData.amenities.forEach(amenity => {
                data.append('amenities_list', amenity);
            });

            // Append files
            images.forEach(img => {
                data.append('image_files', img.file);
            });

            videos.forEach(vid => {
                data.append('video_files', vid.file);
            });

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/properties/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type must NOT be set manually for FormData
                },
                body: data,
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error('API Error:', errData);
                throw new Error(errData.detail || JSON.stringify(errData));
            }

            const resData = await response.json();

            toast({
                title: "Success",
                description: "Property listed successfully! Media is being uploaded.",
            });

            navigate(`/property/${resData.id}`);
        } catch (error: any) {
            console.error('Error creating property:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create property. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const currentCities = formData.state
        ? NIGERIAN_STATES.find(s => s.state === formData.state)?.cities || []
        : [];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-3xl font-bold mb-8">Add New Property</h1>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Property Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Modern 2-Bedroom Apartment in Lekki"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe your property..."
                                        className="h-32"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price (₦) / Year</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 2500000"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label>State</Label>
                                        <Select onValueChange={(value) => handleSelectChange('state', value)} value={formData.state}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {NIGERIAN_STATES.map((state) => (
                                                    <SelectItem key={state.state} value={state.state}>{state.state}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>City/Area</Label>
                                        <Select onValueChange={(value) => handleSelectChange('city', value)} value={formData.city} disabled={!formData.state}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select City" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currentCities.map((city) => (
                                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="location">Full Address</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 12 Freedom Way, Lekki Phase 1"
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Property Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Property Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-2">
                                    <Label>Property Type</Label>
                                    <Select onValueChange={(value) => handleSelectChange('property_type', value)} value={formData.property_type}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {propertyTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="num_bedrooms">Bedrooms</Label>
                                        <Input
                                            id="num_bedrooms"
                                            name="num_bedrooms"
                                            type="number"
                                            value={formData.num_bedrooms}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="num_bathrooms">Bathrooms</Label>
                                        <Input
                                            id="num_bathrooms"
                                            name="num_bathrooms"
                                            type="number"
                                            value={formData.num_bathrooms}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="num_toilets">Toilets</Label>
                                        <Input
                                            id="num_toilets"
                                            name="num_toilets"
                                            type="number"
                                            value={formData.num_toilets}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <Label>Amenities</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {availableAmenities.map((item) => {
                                            const isSelected = formData.amenities.includes(item.name);
                                            return (
                                                <div
                                                    key={item.name}
                                                    onClick={() => toggleAmenity(item.name)}
                                                    className={`
                                                        cursor-pointer flex items-center gap-3 p-4 rounded-xl border transition-all duration-200
                                                        ${isSelected
                                                            ? 'bg-primary/10 border-primary text-primary'
                                                            : 'bg-background border-border hover:border-primary/50 text-muted-foreground'}
                                                    `}
                                                >
                                                    <item.icon className="w-5 h-5" />
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Property Media</CardTitle>
                                    <div className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                        Tip: Landscape (horizontal) photos look best
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Images */}
                                <div className="grid gap-2">
                                    <Label htmlFor="images" className="flex items-center gap-2">
                                        Upload Images
                                        <span className="text-xs text-muted-foreground font-normal">(Min 5 required: Rooms, Kitchen, Toilet, Compound, etc.)</span>
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Select Images
                                        </Button>
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </div>

                                {images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {images.map((img, index) => (
                                            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                                                <img src={img.preview} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(img.id)}
                                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                {index === 0 && (
                                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                                                        Cover
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border-t border-border my-4" />

                                {/* Videos */}
                                <div className="grid gap-2">
                                    <Label htmlFor="videos" className="flex items-center gap-2">
                                        Upload Video
                                        <span className="text-xs text-muted-foreground font-normal">(Min 1 required: Walkthrough tour)</span>
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <Button type="button" variant="outline" onClick={() => document.getElementById('video-upload')?.click()}>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Select Video
                                        </Button>
                                        <Input
                                            id="video-upload"
                                            type="file"
                                            multiple
                                            accept="video/*"
                                            className="hidden"
                                            onChange={handleVideoUpload}
                                        />
                                    </div>
                                </div>

                                {videos.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {videos.map((vid, index) => (
                                            <div key={vid.id} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-black">
                                                <video src={vid.preview} controls className="w-full h-full object-contain" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeVideo(vid.id)}
                                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => navigate('/landlord')}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Property'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </main >
            <Footer />
        </div >
    );
}
