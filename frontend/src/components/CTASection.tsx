import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-primary opacity-95" />
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-emerald/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-amber" />
            <span className="text-sm font-medium text-white/90">Start Your Journey Today</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            Ready to Find Your Perfect Match?
          </h2>

          <p className="text-lg text-white/80 mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            Join thousands of landlords and tenants who've found their ideal rental connections. 
            Sign up for free and get started in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Button 
              size="xl" 
              className="w-full sm:w-auto bg-white text-deep-blue hover:bg-white/90 hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
