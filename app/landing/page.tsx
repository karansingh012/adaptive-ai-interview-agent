import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-16">
        <Container>
          <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Phase 10</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Frontend architecture scaffold</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              This placeholder route is reserved for future landing page implementation.
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
