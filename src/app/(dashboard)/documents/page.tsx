import { Card, CardContent } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Governing docs, financials, and meeting minutes.
        </p>
      </div>
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Document storage (Cloudflare R2) is coming in a later session.
        </CardContent>
      </Card>
    </div>
  );
}
