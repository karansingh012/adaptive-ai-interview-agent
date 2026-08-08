import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export default function InterviewPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-16">
        <Container>
          <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
            <h1 className="text-2xl font-semibold">Interview experience placeholder</h1>
            <p className="mt-4 text-muted-foreground">The interview shell will be implemented here in a future step.</p>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
