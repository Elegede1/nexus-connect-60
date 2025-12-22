
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Users, Building2, MessageSquare, Search, Info, LogOut, UserCircle, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const navLinks = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Listings', href: '/listings', icon: Search },
  { name: 'For Tenants', href: '/tenant', icon: Users },
  { name: 'For Landlords', href: '/landlord', icon: Building2 },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'About', href: '/about', icon: Info },
];

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_property_id?: number | null;
  related_chat_id?: number | null;
  created_at: string;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, token, refreshAccessToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch unread messages count
  useEffect(() => {
    if (!token) return;

    const fetchCounts = async (currentToken: string) => {
      try {
        // Fetch Unread Messages Count
        let chatResponse = await fetch(`${API_URL}/api/chat/unread-count/`, {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });

        if (chatResponse.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            // Retry with new token
            chatResponse = await fetch(`${API_URL}/api/chat/unread-count/`, {
              headers: { 'Authorization': `Bearer ${newToken}` },
            });
            currentToken = newToken;
          } else {
            return; // logout handled in refreshAccessToken
          }
        }

        if (chatResponse.ok) {
          const data = await chatResponse.json();
          setUnreadCount(data.count);
        }

        // Fetch Notifications
        const notifResponse = await fetch(`${API_URL}/api/notifications/`, {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });

        if (notifResponse.ok) {
          const data = await notifResponse.json();
          // Handle DRF pagination which wraps results in an object
          const notificationsList: Notification[] = Array.isArray(data) ? data : (data.results || []);

          setNotifications(notificationsList);
          setUnreadNotifications(notificationsList.filter(n => !n.is_read).length);
        }

      } catch (error) {
        console.error('Error fetching navbar data:', error);
      }
    };

    fetchCounts(token);
    // Poll every 30 seconds
    const interval = setInterval(() => fetchCounts(token), 30000);

    const handleRefresh = () => fetchCounts(token);
    window.addEventListener('refresh-notifications', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-notifications', handleRefresh);
    };
  }, [token, API_URL, refreshAccessToken]);

  const markAllNotificationsRead = async () => {
    if (!token) return;
    try {
      let response = await fetch(`${API_URL}/api/notifications/mark-all-read/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          response = await fetch(`${API_URL}/api/notifications/mark-all-read/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      if (response.ok) {
        // Optimistically update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadNotifications(0);
      }
    } catch (error) {
      console.error("Failed to mark all read", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Navigate
    if (notification.related_property_id) {
      navigate(`/property/${notification.related_property_id}`);
    } else if (notification.related_chat_id) {
      navigate(`/messages`);
    }
  };

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    setNotifications([]);
    setUnreadNotifications(0);
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.first_name[0] && user.last_name && user.last_name[0]) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Filter links based on role
  const filteredLinks = navLinks.filter(link => {
    if (!user) return true;

    if (link.name === 'For Tenants' && user.role === 'LANDLORD') return false;
    if (link.name === 'For Landlords' && user.role === 'TENANT') return false;

    return true;
  });

  const profilePath = user?.role === 'LANDLORD' ? '/landlord-profile' : '/tenant-profile';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text hidden sm:block">HomeHive</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {filteredLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (!user && (link.name === 'For Tenants' || link.name === 'For Landlords')) {
                    navigate('/auth?mode=signup');
                  } else {
                    navigate(link.href);
                  }
                }}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group cursor-pointer"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
                {link.name === 'Messages' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {user ? (
              <>
                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/50">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      {unreadNotifications > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[300px] sm:w-[380px] p-0">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <Button variant="ghost" size="sm" className="text-xs h-auto px-2 text-primary" onClick={markAllNotificationsRead}>
                        Mark all as read
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className={cn("p-4 flex items-start gap-3 cursor-pointer", !notification.is_read && "bg-muted/30")}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className={cn("w-2 h-2 mt-1.5 rounded-full shrink-0", !notification.is_read ? "bg-primary" : "bg-transparent")} />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{notification.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                              <p className="text-[10px] text-muted-foreground/70">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-border bg-muted/20">
                      <Button variant="ghost" className="w-full text-xs h-8" onClick={markAllNotificationsRead}>
                        View all
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} alt={user.username} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <span className="text-[10px] uppercase font-bold text-primary mt-1 tracking-wider bg-primary/10 w-fit px-1.5 py-0.5 rounded">
                          {user.role}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={profilePath} className="cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'LANDLORD' && (
                      <DropdownMenuItem asChild>
                        <Link to="/landlord" className="cursor-pointer">
                          <Building2 className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'TENANT' && (
                      <DropdownMenuItem asChild>
                        <Link to="/tenant" className="cursor-pointer">
                          <Home className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500 cursor-pointer focus:text-red-500" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth?mode=login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg animate-in slide-in-from-top-5">
          <div className="p-4 space-y-2">
            {filteredLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <link.icon className="w-4 h-4 text-primary" />
                {link.name}
              </Link>
            ))}
            {!user && (
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                <Button variant="outline" asChild onClick={() => setIsOpen(false)}>
                  <Link to="/auth?mode=login">Log in</Link>
                </Button>
                <Button asChild onClick={() => setIsOpen(false)}>
                  <Link to="/auth?mode=signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
