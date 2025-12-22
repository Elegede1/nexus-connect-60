import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Eye, TrendingUp, Users, Heart, Globe } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Trust",
      description: "Building secure connections between landlords and tenants with verified listings and transparent processes.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "Clear pricing, honest descriptions, and open communication at every step of the rental journey.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: TrendingUp,
      title: "Growth",
      description: "Continuously improving our platform to better serve the evolving needs of the rental market.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Users,
      title: "Community",
      description: "Fostering meaningful relationships between property owners and home seekers.",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Heart,
      title: "Care",
      description: "Treating every user with respect and providing support throughout their housing journey.",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Making quality housing accessible to everyone, regardless of background or location.",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-in">
            About <span className="text-primary">HomeHive</span>
          </h1>
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Connecting Homes, Connecting People
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                HomeHive was born from a simple frustration: finding a home shouldn't be complicated. 
                In 2024, our founders experienced firsthand the challenges of navigating the rental 
                market—endless calls, unresponsive landlords, and hidden fees.
              </p>
              <p className="text-muted-foreground mb-4">
                We believed there had to be a better way. So we built HomeHive—a platform that 
                directly connects landlords with tenants, eliminating the middleman and creating 
                transparent, trustworthy rental experiences.
              </p>
              <p className="text-muted-foreground">
                Today, HomeHive serves thousands of users, helping them find their perfect home 
                or the ideal tenant, one connection at a time.
              </p>
            </div>
            <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-emerald-500/20 to-amber-500/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-2">5K+</div>
                  <div className="text-muted-foreground">Happy Users</div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-xl bg-emerald-500/20 flex items-center justify-center animate-pulse">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">98%</div>
                  <div className="text-xs text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6 animate-fade-in">Our Mission</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            To revolutionize the rental experience by creating a seamless, transparent, and 
            trustworthy platform where landlords and tenants can connect directly, fostering 
            communities and turning houses into homes.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className={`w-14 h-14 rounded-xl ${value.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <value.icon className={`w-7 h-7 ${value.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Join Our Journey</h2>
          <p className="text-muted-foreground mb-8">
            Whether you're a landlord looking to reach quality tenants or a tenant searching 
            for your next home, HomeHive is here to help.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/listings"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-300 hover:scale-105"
            >
              Browse Listings
            </a>
            <a
              href="/auth"
              className="px-8 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all duration-300 hover:scale-105"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
