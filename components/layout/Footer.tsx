import { Container } from "@/components/layout/Container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/80">
      <Container className="flex items-center justify-between py-6 text-sm text-muted-foreground">
        <p>© 2026 Intervu AI</p>
        <p>Adaptive interview experiences for modern teams.</p>
      </Container>
    </footer>
  );
}
