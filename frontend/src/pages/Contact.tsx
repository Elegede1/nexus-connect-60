import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, MessageCircle, FileQuestion, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const quickLinks = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Start Chat",
    },
    {
      icon: FileQuestion,
      title: "FAQs",
      description: "Find quick answers",
      action: "View FAQs",
    },
    {
      icon: Clock,
      title: "Support Hours",
      description: "Mon-Fri, 9AM-6PM EST",
      action: "Schedule Call",
    },
  ];

  const contactInfo = [
    { icon: Mail, label: "Email", value: "support@homehive.com" },
    { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
    { icon: MapPin, label: "Address", value: "123 Property Lane, Real Estate City, RC 10001" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-in">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
            We're here to help you find your perfect home
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label 
                        htmlFor="name"
                        className={`transition-colors duration-300 ${focusedField === 'name' ? 'text-primary' : ''}`}
                      >
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className={`transition-all duration-300 ${focusedField === 'name' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label 
                        htmlFor="email"
                        className={`transition-colors duration-300 ${focusedField === 'email' ? 'text-primary' : ''}`}
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className={`transition-all duration-300 ${focusedField === 'email' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label 
                      htmlFor="subject"
                      className={`transition-colors duration-300 ${focusedField === 'subject' ? 'text-primary' : ''}`}
                    >
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      className={`transition-all duration-300 ${focusedField === 'subject' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label 
                      htmlFor="message"
                      className={`transition-colors duration-300 ${focusedField === 'message' ? 'text-primary' : ''}`}
                    >
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      className={`min-h-[150px] transition-all duration-300 ${focusedField === 'message' ? 'border-primary ring-2 ring-primary/20' : ''}`}
                      placeholder="Tell us more about your inquiry..."
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full transition-all duration-300 hover:scale-[1.02]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {/* Contact Info & Map */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div
                      key={info.label}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors duration-300"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{info.label}</div>
                        <div className="text-foreground font-medium">{info.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <h2 className="text-2xl font-bold text-foreground mb-6">Our Location</h2>
                <div className="aspect-video rounded-2xl bg-muted overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald-500/5 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
                      <p className="text-muted-foreground">Map integration available</p>
                      <p className="text-sm text-muted-foreground">123 Property Lane, Real Estate City</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <h2 className="text-2xl font-bold text-foreground mb-6">Quick Support</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {quickLinks.map((link, index) => (
                    <button
                      key={link.title}
                      className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1 text-left group"
                    >
                      <link.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="font-semibold text-foreground mb-1">{link.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                      <span className="text-sm text-primary font-medium">{link.action} →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
