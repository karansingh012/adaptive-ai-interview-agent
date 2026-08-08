import { Card as UiCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <UiCard className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </UiCard>
  );
}
