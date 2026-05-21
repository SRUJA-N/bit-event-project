import { useState } from "react";
import { useListEvents, getListEventsQueryKey, useApproveEvent } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Check, X } from "lucide-react";
import { format } from "date-fns";

export function AdminEvents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    department: deptFilter !== "all" ? deptFilter : undefined,
  };

  const { data: events, isLoading } = useListEvents(queryParams, {
    query: {
      queryKey: getListEventsQueryKey(queryParams)
    }
  });

  const approveMutation = useApproveEvent();

  const handleStatusChange = (eventId: number, newStatus: 'approved' | 'rejected') => {
    approveMutation.mutate({
      id: eventId,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        toast({
          title: `Event ${newStatus}`,
          description: `The event has been ${newStatus} successfully.`,
        });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey(queryParams) });
        queryClient.invalidateQueries({ queryKey: ['/api/events/stats'] });
      },
      onError: (err) => {
        toast({
          title: "Update failed",
          description: err.message || "Failed to update event status",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Manage Events</h1>
        <p className="text-muted-foreground mt-1">Approve, reject, and monitor all platform events.</p>
      </div>

      <Card>
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg flex items-center justify-between">
            Filter Events
            {approveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search titles..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-events"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-dept-filter">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="CSE-ICB">CSE-ICB</SelectItem>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="ISE">ISE</SelectItem>
                <SelectItem value="ECE">ECE</SelectItem>
                <SelectItem value="AI&ML">AI&ML</SelectItem>
                <SelectItem value="ME">ME</SelectItem>
                <SelectItem value="CV">CV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Event Info</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Slots & Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : !events || events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No events match your criteria.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-semibold">{event.title}</div>
                    <Badge variant="outline" className="mt-1 text-xs">{event.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{event.date}</div>
                    <div className="text-xs text-muted-foreground">{event.time}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {event.createdByFacultyName}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{event.totalSlots} total</div>
                    <div className="text-xs font-medium text-primary">
                      {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      event.status === 'approved' ? 'bg-green-500 hover:bg-green-600' :
                      event.status === 'rejected' ? 'bg-destructive hover:bg-destructive' :
                      'bg-amber-500 hover:bg-amber-600'
                    }>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {event.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 border-green-200 hover:bg-green-50 h-8"
                          onClick={() => handleStatusChange(event.id, 'approved')}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-event-${event.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8"
                          onClick={() => handleStatusChange(event.id, 'rejected')}
                          disabled={approveMutation.isPending}
                          data-testid={`button-reject-event-${event.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground mr-2">No actions</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
