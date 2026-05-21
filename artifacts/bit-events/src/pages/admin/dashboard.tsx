import { Link } from "wouter";
import { useGetEventStats, getGetEventStatsQueryKey, useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, IndianRupee, Activity, Clock, Clock3, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetEventStats({
    query: { queryKey: getGetEventStatsQueryKey() }
  });

  const { data: pendingEvents, isLoading: eventsLoading } = useListEvents(
    { status: 'pending' }, 
    { query: { queryKey: getListEventsQueryKey({ status: 'pending' }) } }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and pending approvals.</p>
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
              <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
              <Clock3 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pendingEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Events awaiting review</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-accent shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              <p className="text-xs text-muted-foreground mt-1">Platform-wide signups</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground mt-1">Platform-wide revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Needs Approval</h2>
            <Link href="/admin/events">
              <Button variant="outline" size="sm">View All Events</Button>
            </Link>
          </div>

          {eventsLoading ? (
            <div>Loading...</div>
          ) : pendingEvents && pendingEvents.length > 0 ? (
            <div className="space-y-4">
              {pendingEvents.map(event => (
                <Card key={event.id} className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-white">{event.department}</Badge>
                        <Badge className="bg-amber-500 text-white hover:bg-amber-600">Pending</Badge>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        By {event.createdByFacultyName} • {event.date} • {event.totalSlots} slots
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Link href="/admin/events">
                        <Button className="w-full md:w-auto bg-primary text-primary-foreground">
                          Review Request
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/10 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground text-center mt-1">There are no pending events requiring your approval at this time.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="h-full">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              <Link href="/admin/events" className="block p-4 hover:bg-muted/50 transition-colors">
                <div className="font-medium text-primary">Manage All Events</div>
                <div className="text-sm text-muted-foreground mt-1">View, approve, or reject any event on the platform.</div>
              </Link>
              <Link href="/admin/reports" className="block p-4 hover:bg-muted/50 transition-colors">
                <div className="font-medium text-primary">Generate Reports</div>
                <div className="text-sm text-muted-foreground mt-1">Download attendance and revenue reports for completed events.</div>
              </Link>
              <Link href="/faculty/events/new" className="block p-4 hover:bg-muted/50 transition-colors">
                <div className="font-medium text-primary">Create Event as Admin</div>
                <div className="text-sm text-muted-foreground mt-1">Admins can bypass approval and publish directly.</div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
