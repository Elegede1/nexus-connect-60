import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    User, Mail, Phone, Building2, Bell, Lock, Camera,
    Save, ArrowLeft, UserCircle, Home, Image as ImageIcon, Upload
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function ProfileSettings() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user: authUser, token: authToken, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // File states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        avatar: '', // URL for display
        cover_photo: '', // URL for display
        bio: '',
        email_notifications: true,
        push_notifications: true,
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/auth');
            return;
        }

        try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            fetchProfile();
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/auth');
        }
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/auth/profile/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    phone_number: data.phone_number || '',
                    avatar: data.avatar || '',
                    cover_photo: data.cover_photo || '',
                    bio: data.bio || '',
                    email_notifications: data.email_notifications ?? true,
                    push_notifications: data.push_notifications ?? true,
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);

            if (type === 'avatar') {
                setAvatarFile(file);
                setFormData(prev => ({ ...prev, avatar: previewUrl }));
            } else {
                setCoverFile(file);
                setFormData(prev => ({ ...prev, cover_photo: previewUrl }));
            }
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('access_token');

        // Create FormData object
        const dataToSend = new FormData();
        dataToSend.append('first_name', formData.first_name);
        dataToSend.append('last_name', formData.last_name);
        dataToSend.append('phone_number', formData.phone_number);
        dataToSend.append('bio', formData.bio);
        dataToSend.append('email_notifications', String(formData.email_notifications));
        dataToSend.append('push_notifications', String(formData.push_notifications));

        if (avatarFile) {
            dataToSend.append('avatar_file', avatarFile);
        }
        if (coverFile) {
            dataToSend.append('cover_file', coverFile);
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/profile/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type header when sending FormData, let browser set it with boundary
                },
                body: dataToSend,
            });

            if (response.ok) {
                const updatedUser = await response.json();
                updateUser(updatedUser);
                setUser(updatedUser);

                // Clear file states
                setAvatarFile(null);
                setCoverFile(null);

                toast({
                    title: 'Success!',
                    description: 'Your profile has been updated.',
                });

                // Redirect to appropriate profile
                if (updatedUser.role === 'LANDLORD') {
                    navigate('/landlord-profile');
                } else {
                    navigate('/tenant-profile');
                }
            } else {
                console.error('Failed response', await response.text());
                toast({
                    title: 'Error',
                    description: 'Failed to update profile',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Unable to connect to server',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getUserInitials = () => {
        if (formData.first_name && formData.last_name) {
            return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
        }
        return formData.email?.substring(0, 2).toUpperCase() || 'U';
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/profile')}
                            className="mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Profile
                        </Button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage your account information and preferences
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Profile Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserCircle className="w-5 h-5" />
                                    Profile Information
                                </CardTitle>
                                <CardDescription>
                                    Update your personal information and photos
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                {/* Cover Photo */}
                                <div className="space-y-3">
                                    <Label>Cover Photo</Label>
                                    <div
                                        className="relative h-48 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border group cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => coverInputRef.current?.click()}
                                    >
                                        {formData.cover_photo ? (
                                            <img src={formData.cover_photo} alt="Cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                <ImageIcon className="w-8 h-8 mb-2" />
                                                <span className="text-sm">Click to upload cover photo</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Change Cover
                                            </Button>
                                        </div>
                                        <input
                                            type="file"
                                            ref={coverInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'cover')}
                                        />
                                    </div>
                                </div>

                                {/* Avatar Section */}
                                <div className="flex flex-col items-center gap-6 sm:flex-row">
                                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                        <Avatar className="h-24 w-24 border-4 border-primary/20 group-hover:border-primary/50 transition-colors">
                                            <AvatarImage src={formData.avatar} />
                                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                                {getUserInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                        <input
                                            type="file"
                                            ref={avatarInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'avatar')}
                                        />
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <h3 className="font-medium">Profile Photo</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Click on the avatar to upload a new photo. Recommended size: 400x400px.
                                        </p>
                                        <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                                            Upload New Photo
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                {/* Form Fields */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input
                                            id="last_name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="pl-10 bg-muted"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="phone_number"
                                            type="tel"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            className="pl-10"
                                            placeholder="+234 xxx xxx xxxx"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Profile Tagline / Bio</Label>
                                    <Input
                                        id="bio"
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="E.g. Professional Landlord with 5+ years experience"
                                    />
                                    <p className="text-xs text-muted-foreground">A short write-up displayed on your profile</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                                        <Save className="w-4 h-4 mr-2" />
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/profile')}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notification Preferences */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5" />
                                    Notification Preferences
                                </CardTitle>
                                <CardDescription>
                                    Manage how you receive updates
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive notifications via email
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.email_notifications}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, email_notifications: checked })
                                        }
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Push Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive push notifications in-app
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.push_notifications}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, push_notifications: checked })
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Account Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" className="w-full justify-start">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Change Password
                                </Button>

                                <Separator />

                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Account Type</p>
                                    <div className="flex items-center gap-2">
                                        {user.role === 'LANDLORD' ? (
                                            <Building2 className="w-4 h-4 text-primary" />
                                        ) : (
                                            <Home className="w-4 h-4 text-primary" />
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                            {user.role === 'LANDLORD' ? 'Landlord Account' : 'Tenant Account'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Account type cannot be changed
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
