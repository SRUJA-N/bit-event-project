import { Link } from "wouter";
import { useGetMyRegistrations, getGetMyRegistrationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ExternalLink, AlertCircle, CheckCircle, CheckCircle2, Clock3 } from "lucide-react";
import { format } from "date-fns";

export function MyRegistrations() {
  const { data: registrations, isLoading } = useGetMyRegistrations({
    query: {
      queryKey: getGetMyRegistrationsQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Registrations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Registrations</h1>
        <p className="text-muted-foreground">Track your event signups and payment statuses.</p>
      </div>

      {!registrations?.length ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No registrations yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven't signed up for any events. Browse the events explorer to find upcoming activities.
          </p>
          <Link href="/">
            <Button>Explore Events</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {registrations.map(reg => {
            const isRejected = reg.paymentStatus === 'rejected';
            const isApproved = reg.paymentStatus === 'approved';
            const isPending = reg.paymentStatus === 'pending';
            const event = reg.event;

            if (!event) return null;

            return (
              <Card key={reg.id} className="flex flex-col h-full overflow-hidden">
                <div className={`h-2 w-full ${isRejected ? 'bg-destructive' : isApproved ? 'bg-green-500' : 'bg-amber-400'}`} />
                <CardHeader>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <CardTitle className="text-xl leading-tight">
                      <Link href={`/events/${event.id}`} className="hover:text-primary transition-colors">
                        {event.title}
                      </Link>
                    </CardTitle>
                    {isRejected && <Badge variant="destructive" className="shrink-0 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Rejected</Badge>}
                    {isApproved && <Badge className="bg-green-500 hover:bg-green-600 shrink-0 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>}
                    {isPending && <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 shrink-0 flex items-center gap-1"><Clock3 className="w-3 h-3" /> Pending</Badge>}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 space-y-4">
                  {isRejected && reg.adminComment && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Registration Rejected</AlertTitle>
                      <AlertDescription>
                        {reg.adminComment}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isApproved && reg.adminComment && (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle>Note from Admin</AlertTitle>
                      <AlertDescription>
                        {reg.adminComment}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm border border-border/50">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registration ID</span>
                      <span className="font-mono font-medium">#{reg.id.toString().padStart(4, '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registered on</span>
                      <span>{format(new Date(reg.registeredAt), 'MMM d, yyyy')}</span>
                    </div>
                    {event.registrationFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fee Paid</span>
                        <span>₹{event.registrationFee}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/20 border-t pt-4 flex gap-2">
                  <Link href={`/events/${event.id}`} className="flex-1">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <ExternalLink className="h-4 w-4" /> View Event
                    </Button>
                  </Link>
                  {isApproved && (
                    <Link href={`/events/${event.id}/feedback`} className="flex-1">
                      <Button variant="secondary" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" data-testid={`button-feedback-${event.id}`}>
                        Leave Feedback
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
