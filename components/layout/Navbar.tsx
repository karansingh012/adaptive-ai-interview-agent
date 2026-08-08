import Link from "next/link";
import { Container } from "@/components/layout/Container";

export function Navbar() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Intervu AI
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/interview" className="transition hover:text-foreground">
            Interview
          </Link>
          <Link href="/report" className="transition hover:text-foreground">
            Report
          </Link>
        </nav>
      </Container>
    </header>
  );
}
