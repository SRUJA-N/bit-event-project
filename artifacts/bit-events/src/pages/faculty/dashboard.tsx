import { Link } from "wouter";
import { useGetEventStats, getGetEventStatsQueryKey, useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, IndianRupee, FileText, PlusCircle, Settings, ClipboardList } from "lucide-react";

export function FacultyDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetEventStats({
    query: { queryKey: getGetEventStatsQueryKey() }
  });

  const { data: events, isLoading: eventsLoading } = useListEvents(
    {}, 
    { query: { queryKey: getListEventsQueryKey() } }
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Faculty Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your department's events and registrations.</p>
        </div>
        <Link href="/faculty/events/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex gap-2" data-testid="button-create-event-link">
            <PlusCircle className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {!statsLoading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.approvedEvents} approved, {stats.pendingEvents} pending
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-accent shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registrations</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              <p className="text-xs text-muted-foreground mt-1">Total student signups</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground mt-1">From paid registrations</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-muted-foreground shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.departmentBreakdown.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active departments</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4 border-b pb-2">My Events</h2>
        
        {eventsLoading ? (
          <div>Loading events...</div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {events.map(event => (
              <Card key={event.id} className="flex flex-col shadow-sm border-border/50">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-background">{event.department}</Badge>
                    <Badge className={
                      event.status === 'approved' ? 'bg-green-500 hover:bg-green-600 text-white' : 
                      event.status === 'rejected' ? 'bg-destructive text-destructive-foreground' : 
                      'bg-amber-500 hover:bg-amber-600 text-white'
                    }>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-3.5 w-3.5" /> {event.date}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="py-4 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" /> Registrations
                    </span>
                    <span className="font-medium">{event.totalSlots - event.availableSlots} / {event.totalSlots}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, ((event.totalSlots - event.availableSlots) / event.totalSlots) * 100)}%` }}
                    ></div>
                  </div>
                </CardContent>
                
                <CardContent className="p-0 mt-auto border-t bg-muted/10 grid grid-cols-2 divide-x">
                  <Link href={`/faculty/events/${event.id}/edit`} className="w-full">
                    <Button variant="ghost" className="w-full h-12 rounded-none rounded-bl-xl text-muted-foreground hover:text-primary hover:bg-muted/30">
                      <Settings className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </Link>
                  <Link href={`/faculty/events/${event.id}/registrations`} className="w-full">
                    <Button variant="ghost" className="w-full h-12 rounded-none rounded-br-xl text-muted-foreground hover:text-primary hover:bg-muted/30" data-testid={`button-review-${event.id}`}>
                      <ClipboardList className="h-4 w-4 mr-2" /> Review
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-xl bg-muted/20">
            <h3 className="text-lg font-medium mb-2">No events created</h3>
            <p className="text-muted-foreground mb-4">You haven't created any events yet.</p>
            <Link href="/faculty/events/new">
              <Button>Create Your First Event</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
