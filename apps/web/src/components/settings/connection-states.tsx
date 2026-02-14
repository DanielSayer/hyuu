import { formatDate } from "@/lib/utils";
import { ExternalLink, Link2, Link2Off, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

function StravaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

type DisconnectedStateProps = {
  onConnect: () => void;
};

export function DisconnectedState({ onConnect }: DisconnectedStateProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <StravaLogo className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Strava</CardTitle>
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
          Connect your Strava account to automatically sync your runs, rides,
          and other activities. Your workout data will be imported and kept up
          to date.
        </p>
        <Button
          className="bg-[#FC4C02] text-white hover:bg-[#e04400]"
          onClick={onConnect}
        >
          <Link2 className="mr-2 h-4 w-4" />
          Connect to Strava
        </Button>
      </CardContent>
    </Card>
  );
}

type ConnectedStateProps = {
  athleteName: string;
  connectedAt: string;
  onTestConnection: () => void;
  onDisconnect: () => void;
  isTesting: boolean;
  isDisconnecting: boolean;
};

export function ConnectedState({
  athleteName,
  connectedAt,
  onTestConnection,
  onDisconnect,
  isTesting,
  isDisconnecting,
}: ConnectedStateProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FC4C02]/10">
              <StravaLogo className="h-6 w-6 text-[#FC4C02]" />
            </div>
            <div>
              <CardTitle className="text-lg">Strava</CardTitle>
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
              <a
                href="https://www.strava.com/settings/apps"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Strava
              </a>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Link2Off className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Strava?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the connection to your Strava account. Your
                  previously synced data will remain, but no new activities will
                  be imported.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDisconnect}
                  disabled={isDisconnecting}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
