import { formatDate } from "@/lib/utils";
import { ExternalLink, Link2, RefreshCw } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type DisconnectedStateProps = {
  onConnect: () => void;
  isConnecting?: boolean;
};

export function DisconnectedState({
  onConnect,
  isConnecting = false,
}: DisconnectedStateProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Link2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Intervals</CardTitle>
              <CardDescription>
                Activity tracking & workout sync
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            Not connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your Intervals account to sync your athlete profile and
          activity data. Your existing synced data remains available if you
          disconnect later.
        </p>
        <Button onClick={onConnect} disabled={isConnecting}>
          <Link2 className="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect to Intervals"}
        </Button>
      </CardContent>
    </Card>
  );
}

type ConnectedStateProps = {
  athleteName: string;
  connectedAt: string;
  onTestConnection: () => void;
  isTesting: boolean;
};

export function ConnectedState({
  athleteName,
  connectedAt,
  onTestConnection,
  isTesting,
}: ConnectedStateProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Intervals</CardTitle>
              <CardDescription>
                Activity tracking & workout sync
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-green-500/30 bg-green-500/10 text-green-400"
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Account</p>
              <p className="font-medium">{athleteName || "Unknown"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Connected since</p>
              <p className="font-medium">{formatDate(connectedAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTestConnection}
            disabled={isTesting}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isTesting ? "animate-spin" : ""}`}
            />
            Check Connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a href="https://intervals.icu" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Intervals
              </a>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
