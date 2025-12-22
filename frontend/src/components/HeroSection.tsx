import { ArrowRight, Shield, Clock, Handshake, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const CountUp = ({ end, suffix = "" }: { end: string | number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const numericEnd = typeof end === 'string' ? parseInt(end) || 0 : end;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = numericEnd / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericEnd) {
        setCount(numericEnd);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [numericEnd]);

  return <>{count}{suffix}</>;
};

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    verified_users: 0,
    avg_match_time: "0h",
    successful_matches: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetch(`${API_URL}/api/auth/metrics/`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Failed to fetch metrics", err));
  }, [API_URL]);

  const stats = [
    { icon: Shield, label: 'Verified Users', value: metrics.verified_users, suffix: "+" },
    { icon: Clock, label: 'Avg. Match Time', value: metrics.avg_match_time },
    { icon: Handshake, label: 'Successful Matches', value: metrics.successful_matches, suffix: "+" },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-deep-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-md mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">Connecting Homes, Connecting People</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            Welcome to
            <span className="block mt-2 text-gradient">HomeHive</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
            Connect directly with landlords and tenants. Verified profiles, secure messaging, and transparent reviews—all in one place.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '250ms' }}>
            <div className="relative flex items-center bg-card rounded-2xl shadow-lg border border-border p-2">
              <Search className="w-5 h-5 text-muted-foreground ml-4" />
              <input
                type="text"
                placeholder="Search by location, price, or property type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Link to="/listings">
                <Button variant="hero" size="lg">
                  Search
                </Button>
              </Link>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Link to="/listings">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                Find a Home
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
              List Your Property
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex flex-col items-center p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-md hover-lift animate-fade-up"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center mb-3">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-foreground">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
