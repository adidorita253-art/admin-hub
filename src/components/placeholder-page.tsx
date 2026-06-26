import { PageHeader } from "./page-header";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  features,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Module ready to be built</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              The architecture for this module is defined. Tell me to build it
              next and I'll wire up the full UI.
            </p>
          </div>
          <ul className="mt-4 grid max-w-xl gap-2 text-left text-sm text-muted-foreground sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
