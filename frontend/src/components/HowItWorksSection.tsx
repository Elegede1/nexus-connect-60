import { UserPlus, Search, MessageCircle, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Sign up and complete your verified profile in minutes.',
    step: 1,
  },
  {
    icon: Search,
    title: 'Browse & Match',
    description: 'Explore listings or let our algorithm find your perfect match.',
    step: 2,
  },
  {
    icon: MessageCircle,
    title: 'Connect & Chat',
    description: 'Message directly and schedule viewings with ease.',
    step: 3,
  },
  {
    icon: Home,
    title: 'Move In',
    description: 'Sign documents digitally and start your new chapter.',
    step: 4,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-violet/10 text-violet text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Four Simple Steps to Your
            <span className="text-gradient"> New Home</span>
          </h2>
          <p className="text-muted-foreground">
            Our streamlined process makes finding or listing a rental quick and easy.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          {/* Connection Line Removed */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={cn(
                  "relative text-center animate-fade-up"
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Step Number */}
                <div className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center shadow-lg animate-pulse-glow">
                  <step.icon className="w-8 h-8 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
