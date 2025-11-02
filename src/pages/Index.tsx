import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Zap, Eye, FileCheck, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SecureShare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
              <Shield className="h-4 w-4" />
              <span>Military-Grade Encryption</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Share Files
              <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Securely & Simply
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Protect your sensitive documents with AES-256 encryption and time-bound OTP access. 
              Share files with confidence knowing they're secured by the same technology banks use.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-hero shadow-elegant text-lg px-8">
                  Start Sharing Securely
                </Button>
              </Link>
              <Link to="/access">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Access a File
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise Security, Consumer Simplicity
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with security-first principles to protect your most sensitive information
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 gradient-card border-primary/20 hover:shadow-elegant transition-smooth">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AES-256 Encryption</h3>
              <p className="text-muted-foreground">
                Military-grade encryption protects your files. Each file gets a unique encryption key 
                that's protected by your recipient's OTP.
              </p>
            </Card>

            <Card className="p-8 gradient-card border-secondary/20 hover:shadow-elegant transition-smooth">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Time-Bound Access</h3>
              <p className="text-muted-foreground">
                Set expiration times on shared files. OTPs automatically expire, and files can be 
                revoked instantly at any time.
              </p>
            </Card>

            <Card className="p-8 gradient-card border-accent/20 hover:shadow-elegant transition-smooth">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">One-Time Passwords</h3>
              <p className="text-muted-foreground">
                Recipients receive secure OTP codes via email. Configurable validity periods and 
                access attempt limits provide flexible control.
              </p>
            </Card>

            <Card className="p-8 gradient-card border-success/20 hover:shadow-elegant transition-smooth">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-6">
                <FileCheck className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Integrity Verification</h3>
              <p className="text-muted-foreground">
                SHA-256 hashing ensures files haven't been tampered with. Downloads are automatically 
                rejected if integrity checks fail.
              </p>
            </Card>

            <Card className="p-8 gradient-card border-primary/20 hover:shadow-elegant transition-smooth">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Complete Audit Trail</h3>
              <p className="text-muted-foreground">
                Track every access attempt with detailed logs. Know exactly when and how your files 
                are accessed with real-time notifications.
              </p>
            </Card>

            <Card className="p-8 gradient-card border-secondary/20 hover:shadow-elegant transition-smooth">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Zero-Knowledge</h3>
              <p className="text-muted-foreground">
                Your files are encrypted before upload. We never have access to your unencrypted data 
                or encryption keys.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 md:p-16 gradient-hero shadow-glow text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Secure Your Files?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust SecureShare for their most sensitive documents.
              Start sharing securely in minutes.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Create Free Account
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">SecureShare</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SecureShare. All rights reserved. Built with security first.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
