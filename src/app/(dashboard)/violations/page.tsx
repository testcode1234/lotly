import { Card, CardContent } from "@/components/ui/card";

export default function ViolationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Violations</h1>
        <p className="text-sm text-muted-foreground">
          Track infractions, evidence, and notices.
        </p>
      </div>
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Violation tracking is coming in a later session.
        </CardContent>
      </Card>
    </div>
  );
}
