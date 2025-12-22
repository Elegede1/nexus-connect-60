import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Building2, UserCircle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// Stock avatars
const STOCK_AVATARS = [
  { id: 'male1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', label: 'Male 1' },
  { id: 'male2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', label: 'Male 2' },
  { id: 'female1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', label: 'Female 1' },
  { id: 'female2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', label: 'Female 2' },
];

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirm: "",
    role: "TENANT" as "LANDLORD" | "TENANT",
    avatar: "",
    rememberMe: false,
    agreeToTerms: false,
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await fetch(`${API_URL}/api/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store tokens using AuthContext
          login(data.access, data.user, data.refresh);

          toast({
            title: "Welcome back!",
            description: `Logged in as ${data.user.role === "LANDLORD" ? "Landlord" : "Tenant"}`,
          });

          // Redirect based on role or previous location
          const from = location.state?.from?.pathname;
          const redirectTo = from || data.redirect_to || (data.user.role === "LANDLORD" ? "/landlord" : "/listings");
          navigate(redirectTo, { replace: true });
        } else {
          toast({
            title: "Login failed",
            description: data.detail || "Invalid credentials",
            variant: "destructive",
          });
        }
      } else {
        // Signup
        if (formData.password !== formData.password_confirm) {
          toast({
            title: "Password mismatch",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/auth/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            username: `${formData.email.split("@")[0]}_${Date.now()}`, // Ensure unique username
            password: formData.password,
            password_confirm: formData.password_confirm,
            role: formData.role,
            first_name: formData.name.split(" ")[0] || "",
            last_name: formData.name.split(" ").slice(1).join(" ") || "",
            avatar: formData.avatar,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Account created!",
            description: "Please log in with your credentials.",
          });
          setIsLogin(true);
        } else {
          toast({
            title: "Signup failed",
            description: data.email?.[0] || data.password?.[0] || "Please check your information",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (!isLogin) {
      // For signup, store role in session before redirecting
      try {
        await fetch(`${API_URL}/api/auth/set-role/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: formData.role }),
        });

        // Redirect to OAuth provider
        window.location.href = `${API_URL}/accounts/${provider.toLowerCase()}/login/`;
      } catch (error) {
        toast({
          title: "Error",
          description: "Unable to initiate social login",
          variant: "destructive",
        });
      }
    } else {
      // For login, just redirect to OAuth
      window.location.href = `${API_URL}/accounts/${provider.toLowerCase()}/login/`;
    }
  };

  const socialProviders = [
    {
      name: "Google",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      bgColor: "bg-white hover:bg-gray-50",
      textColor: "text-gray-700",
    },
    {
      name: "Microsoft",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#00A4EF" d="M1 13h10v10H1z" />
          <path fill="#7FBA00" d="M13 1h10v10H13z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
      ),
      bgColor: "bg-white hover:bg-gray-50",
      textColor: "text-gray-700",
    },
    {
      name: "Apple",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
      bgColor: "bg-black hover:bg-gray-900",
      textColor: "text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-emerald-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02di00aC00djRoNHptLTYgNnYyaDR2LTJoLTR6bTAtNmgtNHY0aDR2LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white mb-2">
            <Home className="w-8 h-8" />
            <span className="text-2xl font-bold">HomeHive</span>
          </Link>
          <p className="text-white/80">Connecting Homes, Connecting People</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="animate-fade-in">
            <h2 className="text-4xl font-bold text-white mb-4">
              Find your perfect home today
            </h2>
            <p className="text-white/80 text-lg">
              Join thousands of landlords and tenants who trust HomeHive for their rental needs.
            </p>
          </div>

          <div className="flex gap-8 text-white/90">
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-3xl font-bold">5K+</div>
              <div className="text-sm text-white/70">Active Listings</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-white/70">Happy Users</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm text-white/70">Satisfaction</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © 2024 HomeHive. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 text-primary mb-8">
            <Home className="w-8 h-8" />
            <span className="text-2xl font-bold">HomeHive</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {isLogin
                ? "Enter your credentials to access your account"
                : "Start your journey with HomeHive today"}
            </p>
          </div>

          {/* Role Selection (Signup Only) */}
          {!isLogin && (
            <div className="mb-6 p-4 border border-border rounded-lg animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <Label className="text-base font-semibold mb-3 block">I am a</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as "LANDLORD" | "TENANT" })}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="role-landlord"
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.role === "LANDLORD"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <RadioGroupItem value="LANDLORD" id="role-landlord" className="sr-only" />
                  <Building2 className={`w-8 h-8 ${formData.role === "LANDLORD" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <div className="font-semibold">Landlord</div>
                    <div className="text-xs text-muted-foreground">List properties</div>
                  </div>
                </Label>

                <Label
                  htmlFor="role-tenant"
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.role === "TENANT"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <RadioGroupItem value="TENANT" id="role-tenant" className="sr-only" />
                  <UserCircle className={`w-8 h-8 ${formData.role === "TENANT" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <div className="font-semibold">Tenant</div>
                    <div className="text-xs text-muted-foreground">Find properties</div>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Social Login */}
          <div className="space-y-3 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {socialProviders.map((provider) => (
              <Button
                key={provider.name}
                type="button"
                variant="outline"
                onClick={() => handleSocialAuth(provider.name)}
                className={`w-full h-12 ${provider.bgColor} ${provider.textColor} border border-border transition-all duration-300 hover:scale-[1.02]`}
              >
                {provider.icon}
                <span className="ml-2">Continue with {provider.name}</span>
              </Button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative my-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Avatar Selection (Signup Only) */}
            {!isLogin && (
              <div className="space-y-3">
                <Label>Profile Picture</Label>
                <div className="grid grid-cols-4 gap-3">
                  {STOCK_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: avatar.url })}
                      className={`relative rounded-full border-2 transition-all hover:scale-105 ${formData.avatar === avatar.url
                        ? "border-primary shadow-md ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={avatar.url} alt={avatar.label} />
                        <AvatarFallback>{avatar.label[0]}</AvatarFallback>
                      </Avatar>
                      {formData.avatar === avatar.url && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Camera className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    placeholder="Or paste custom avatar URL"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password_confirm"
                    type={showPassword ? "text" : "password"}
                    value={formData.password_confirm}
                    onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                    className="pl-10 pr-10 h-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {isLogin ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, rememberMe: checked as boolean })
                    }
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                  }
                  required
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                  I agree to the{" "}
                  <button type="button" className="text-primary hover:underline">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button type="button" className="text-primary hover:underline">
                    Privacy Policy
                  </button>
                </Label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 transition-all duration-300 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign in" : "Create account"
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="text-center text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
