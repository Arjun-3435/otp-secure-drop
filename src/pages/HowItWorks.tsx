import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileUp,
  Key,
  Lock,
  Hash,
  KeyRound,
  Cloud,
  ShieldCheck,
  Code2,
  Cookie,
} from "lucide-react";

const steps = [
  { icon: FileUp, title: "File Selected", desc: "User picks a file in the browser." },
  { icon: Key, title: "AES-256 Key Generated", desc: "A random 256-bit key is created locally via Web Crypto." },
  { icon: Lock, title: "File Encrypted Locally", desc: "AES-GCM encrypts the file in the browser — server never sees plaintext." },
  { icon: Hash, title: "OTP Generated", desc: "A 6-digit one-time password is generated for the recipient." },
  { icon: KeyRound, title: "Key Wrapped with PBKDF2(OTP)", desc: "The AES key is encrypted using a key derived from the OTP." },
  { icon: Cloud, title: "Encrypted File Uploaded", desc: "Only ciphertext + wrapped key reach the server." },
];

const stack = [
  {
    name: "React",
    type: "Library (SPA)",
    language: "TypeScript",
    rendering: "Client-side, Vite-bundled",
    security: "Auto-escaped JSX, strong typing, no eval",
    why: "Fast iteration, huge ecosystem, perfect for browser-side crypto",
    ours: true,
  },
  {
    name: "Angular",
    type: "Full Framework",
    language: "TypeScript",
    rendering: "Client-side, AOT compiled",
    security: "Built-in sanitization, DI scoping",
    why: "Heavier; opinionated structure overkill for our scope",
    ours: false,
  },
  {
    name: "Django",
    type: "Backend Framework",
    language: "Python",
    rendering: "Server-side templates",
    security: "CSRF middleware, ORM-safe queries",
    why: "Server-rendered — can't do zero-knowledge browser encryption",
    ours: false,
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SecureShare</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/how-it-works">
              <Button variant="ghost">How It Works</Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6">
            <ShieldCheck className="h-4 w-4" />
            <span>Security Architecture</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            How SecureShare{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Works
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            A walk-through of the cryptography, defenses, and tech choices that
            keep your files private — even from us.
          </p>
        </div>
      </section>

      {/* End-to-End Encryption Flow */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            End-to-End Encryption Flow
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every step happens in the browser before anything touches the network.
            The server stores only ciphertext.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card
                  key={i}
                  className="p-6 gradient-card border-primary/20 opacity-0 animate-fade-in hover:shadow-elegant transition-smooth"
                  style={{
                    animationDelay: `${i * 250}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10 italic">
            🔒 The server never sees the plaintext file or the raw AES key.
          </p>
        </div>
      </section>

      {/* Attack Prevention */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Attack Prevention
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 gradient-card border-primary/20">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">SQL Injection</h3>
              <p className="text-muted-foreground mb-4">
                We use Supabase parameterized queries — raw SQL inputs are
                impossible.
              </p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                <code>{`supabase
  .from('files')
  .select('*')
  .eq('id', fileId)`}</code>
              </pre>
            </Card>

            <Card className="p-6 gradient-card border-secondary/20">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">XSS</h3>
              <p className="text-muted-foreground mb-4">
                All inputs are sanitized by React's auto-escaping JSX. We never
                use <code className="text-xs bg-muted px-1 py-0.5 rounded">dangerouslySetInnerHTML</code> anywhere
                in the codebase.
              </p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                <code>{`<p>{userInput}</p>
// React escapes < > " ' &
// automatically.`}</code>
              </pre>
            </Card>

            <Card className="p-6 gradient-card border-accent/20">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Cookie className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">CSRF</h3>
              <p className="text-muted-foreground mb-4">
                Supabase JWT tokens are sent as Bearer headers on every request,
                with a SameSite cookie policy preventing cross-origin requests.
              </p>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                <code>{`Authorization: Bearer <jwt>
SameSite=Lax; Secure; HttpOnly`}</code>
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Tech Stack Comparison
          </h2>
          <Card className="p-0 overflow-hidden gradient-card border-primary/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Framework</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Language</th>
                    <th className="text-left p-4 font-semibold">Rendering</th>
                    <th className="text-left p-4 font-semibold">Security</th>
                    <th className="text-left p-4 font-semibold">Why / Why Not</th>
                  </tr>
                </thead>
                <tbody>
                  {stack.map((row) => (
                    <tr
                      key={row.name}
                      className={`border-t ${
                        row.ours ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-4 font-semibold">
                        <div className="flex items-center gap-2">
                          {row.name}
                          {row.ours && (
                            <Badge className="bg-primary text-primary-foreground">
                              Our Choice ✓
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{row.type}</td>
                      <td className="p-4 text-muted-foreground">{row.language}</td>
                      <td className="p-4 text-muted-foreground">{row.rendering}</td>
                      <td className="p-4 text-muted-foreground">{row.security}</td>
                      <td className="p-4 text-muted-foreground">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Why OTP + AES */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Why OTP + AES?
          </h2>
          <Card className="p-8 md:p-12 gradient-card border-primary/20">
            <p className="text-lg text-muted-foreground mb-8">
              AES-256 is fast and unbreakable — but the key itself has to be
              protected. Instead of storing the key on our server, we
              <strong className="text-foreground"> wrap </strong>
              it using a password derived from the recipient's OTP.
            </p>

            {/* Visual */}
            <div className="bg-background/50 rounded-xl p-6 md:p-8 border border-primary/20 mb-8">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2 justify-between text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-xs font-medium">AES Key</p>
                  <p className="text-xs text-muted-foreground">(random 256-bit)</p>
                </div>

                <div className="text-2xl text-muted-foreground">+</div>

                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Hash className="h-8 w-8 text-secondary" />
                  </div>
                  <p className="text-xs font-medium">PBKDF2(OTP)</p>
                  <p className="text-xs text-muted-foreground">(100k rounds)</p>
                </div>

                <div className="text-2xl text-muted-foreground">=</div>

                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-accent" />
                  </div>
                  <p className="text-xs font-medium">Wrapped Key</p>
                  <p className="text-xs text-muted-foreground">(safe to store)</p>
                </div>
              </div>
            </div>

            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">→</span>
                <span>
                  Without the OTP, the wrapped key is just random bytes — even
                  we can't unwrap it.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">→</span>
                <span>
                  PBKDF2 with 100,000 iterations makes brute-forcing the OTP
                  computationally expensive.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">→</span>
                <span>
                  The OTP is delivered out-of-band (email), so an attacker would
                  need to compromise both our database AND the recipient's
                  inbox.
                </span>
              </li>
            </ul>
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
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-smooth">
                Home
              </Link>
              <Link
                to="/how-it-works"
                className="hover:text-foreground transition-smooth"
              >
                How It Works
              </Link>
              <Link to="/auth" className="hover:text-foreground transition-smooth">
                Sign In
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SecureShare
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;
