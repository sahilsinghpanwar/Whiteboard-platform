import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PenNib, UsersThree, Sparkle, Lightning, ArrowRight, GithubLogo } from "@phosphor-icons/react";
import ThemeToggle from "@/components/shared/ThemeToggle";

const Feature = ({ icon: Icon, title, body }) => (
  <div className="p-6 rounded-2xl border bg-card float-shadow transition-transform duration-300 hover:-translate-y-1">
    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
      <Icon size={22} weight="duotone" />
    </div>
    <h3 className="text-lg font-semibold tracking-tight mb-1.5">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <PenNib size={18} weight="fill" color="#fff" />
          </div>
          <span className="font-bold tracking-tight text-lg">Kanvas</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login"><Button variant="ghost" data-testid="nav-login">Sign in</Button></Link>
          <Link to="/register">
            <Button className="rounded-full px-5" data-testid="nav-get-started">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <span className="label-mono">v1 · real-time collaboration</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-4xl">
          The whiteboard where <span className="text-primary">thinking</span> happens together.
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed">
          Sketch, diagram, brainstorm, and ship with your team. Real-time cursors, chat, AI copilots and infinite canvas — all in one focused space.
        </p>
        <div className="flex items-center gap-3 mt-10">
          <Link to="/register">
            <Button size="lg" className="rounded-full px-6 h-12" data-testid="hero-start-free">
              Start for free <ArrowRight className="ml-1.5" size={18} weight="bold" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="rounded-full px-6 h-12" data-testid="hero-signin">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Preview mock */}
        <div className="mt-20 rounded-3xl border overflow-hidden float-shadow bg-card">
          <div className="h-9 border-b flex items-center gap-1.5 px-4 bg-muted/50">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="ml-3 label-mono">kanvas / board</span>
          </div>
          <div className="canvas-grid h-[420px] relative">
            <div className="absolute top-6 left-8 w-40 h-24 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 shadow-md rotate-[-2deg] p-3 text-xs">Kickoff notes</div>
            <div className="absolute top-16 left-64 w-56 rounded-xl bg-card border p-4 shadow-lg">
              <div className="label-mono mb-1.5">AI · brainstorm</div>
              <div className="text-sm">3 concepts drafted from your topic.</div>
            </div>
            <div className="absolute bottom-14 right-14 w-32 h-32 rounded-full border-2 border-primary" />
            <div className="absolute bottom-24 right-56 w-48 h-1 bg-primary" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 h-11 rounded-2xl glass float-shadow flex items-center gap-1 px-2">
              {["select", "pen", "rect", "circle", "text", "sticky"].map((t) => (
                <div key={t} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-primary/10">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature icon={UsersThree} title="Live collaboration" body="Presence, cursors and instant sync via WebSocket." />
          <Feature icon={Sparkle} title="AI copilots" body="Brainstorm, diagram, summarize, and improve text." />
          <Feature icon={Lightning} title="Infinite canvas" body="Pan, zoom, group and organize with zero friction." />
          <Feature icon={PenNib} title="Rich tools" body="Draw, shapes, sticky notes, images and export to PNG/PDF/JSON." />
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Kanvas · Built with love</span>
          <span className="flex items-center gap-1.5 font-mono text-xs"><GithubLogo size={16} /> open-source spirit</span>
        </div>
      </footer>
    </div>
  );
}
