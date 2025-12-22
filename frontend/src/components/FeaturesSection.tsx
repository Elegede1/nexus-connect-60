import { Shield, Search, MessageSquare, Star, FileCheck, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Shield,
    title: 'Verified Profiles',
    description: 'All users undergo identity verification for a trusted community.',
    color: 'emerald',
  },
  {
    icon: Search,
    title: 'Smart Matching',
    description: 'AI-powered algorithm connects compatible landlords and tenants.',
    color: 'deep-blue',
  },
  {
    icon: MessageSquare,
    title: 'Secure Messaging',
    description: 'Communicate directly with end-to-end encrypted chat.',
    color: 'violet',
  },
  {
    icon: Star,
    title: 'Reviews & Ratings',
    description: 'Transparent feedback system for informed decisions.',
    color: 'amber',
  },
  {
    icon: FileCheck,
    title: 'Digital Documents',
    description: 'Sign and manage rental agreements online securely.',
    color: 'emerald',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'Real-time notifications for new listings and messages.',
    color: 'violet',
  },
];

const colorStyles = {
  emerald: 'bg-emerald/10 text-emerald',
  'deep-blue': 'bg-deep-blue/10 text-deep-blue dark:bg-primary/10 dark:text-primary',
  violet: 'bg-violet/10 text-violet',
  amber: 'bg-amber/10 text-amber',
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-emerald/10 text-emerald text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for
            <span className="text-gradient"> Hassle-Free Renting</span>
          </h2>
          <p className="text-muted-foreground">
            We've built the tools to make finding and managing rentals simple, secure, and stress-free.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "group p-6 rounded-2xl bg-card border border-border",
                "hover-lift hover:border-primary/20",
                "animate-fade-up"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                  "transition-transform duration-300 group-hover:scale-110",
                  colorStyles[feature.color as keyof typeof colorStyles]
                )}
              >
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
