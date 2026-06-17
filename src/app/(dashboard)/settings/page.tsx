import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Community profile, dues schedule, and billing.
        </p>
      </div>
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Settings are coming in a later session (board_admin only).
        </CardContent>
      </Card>
    </div>
  );
}
