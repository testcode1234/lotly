import { Card, CardContent } from "@/components/ui/card";

export default function DuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dues</h1>
        <p className="text-sm text-muted-foreground">
          Collect and track monthly dues.
        </p>
      </div>
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Dues collection arrives in Session 2 (Stripe Connect).
        </CardContent>
      </Card>
    </div>
  );
}
