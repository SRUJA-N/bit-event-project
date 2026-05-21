import { useState } from "react";
import { useListEvents, getListEventsQueryKey, useGetEventReport, getGetEventReportQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader, Loader2, Download, FileText, IndianRupee, Users } from "lucide-react";
import { format } from "date-fns";
import type { EventReport } from "@workspace/api-client-react";

export function AdminReports() {
  const { token } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get all approved events that might have registrations
  const { data: events, isLoading: eventsLoading } = useListEvents(
    { status: 'approved' }, 
    { query: { queryKey: getListEventsQueryKey({ status: 'approved' }) } }
  );

  const { data: report, isLoading: reportLoading } = useGetEventReport(
    selectedEventId || 0, 
    { 
      query: { 
        enabled: !!selectedEventId,
        queryKey: getGetEventReportQueryKey(selectedEventId || 0)
      } 
    }
  );

  const handleViewReport = (eventId: number) => {
    setSelectedEventId(eventId);
    setIsReportOpen(true);
  };

  const handleDownloadPdf = async () => {
    if (!selectedEventId || !token) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/reports/event/${selectedEventId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-${selectedEventId}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Generate attendee lists and revenue reports for completed events.</p>
      </div>

      <Card>
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle>Select Event for Report</CardTitle>
          <CardDescription>Only approved events are shown here.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !events || events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No approved events found.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="text-sm">{event.date}</TableCell>
                    <TableCell><Badge variant="outline">{event.department}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {event.totalSlots - event.availableSlots} / {event.totalSlots}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleViewReport(event.id)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        data-testid={`button-view-report-${event.id}`}
                      >
                        <FileText className="h-4 w-4 mr-2" /> View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0 pb-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl text-primary">{report?.event.title || "Loading..."}</DialogTitle>
                <DialogDescription className="mt-1">
                  Generated on {format(new Date(), "PPP")}
                </DialogDescription>
              </div>
              {report && (
                <Button 
                  onClick={handleDownloadPdf} 
                  disabled={isDownloading}
                  className="bg-primary text-primary-foreground"
                  data-testid="button-download-pdf"
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Download PDF
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4 pr-2">
            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Generating report data...</p>
              </div>
            ) : report ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-100 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900/70">Total Reg.</p>
                        <p className="text-2xl font-bold text-blue-900">{report.totalRegistrations}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-100 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-full text-green-600">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900/70">Approved</p>
                        <p className="text-2xl font-bold text-green-900">{report.approvedRegistrations}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-50 border-amber-100 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                        <IndianRupee className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900/70">Total Revenue</p>
                        <p className="text-2xl font-bold text-amber-900">₹{report.totalRevenue}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4 border-b pb-2">Attendee Roster</h3>
                  {report.registrations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                      No registrations for this event yet.
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Reg. Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.registrations.map(reg => (
                            <TableRow key={reg.id}>
                              <TableCell className="font-medium">{reg.student?.name}</TableCell>
                              <TableCell className="text-muted-foreground">{reg.student?.email}</TableCell>
                              <TableCell>{reg.student?.department}</TableCell>
                              <TableCell className="text-sm">{format(new Date(reg.registeredAt), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                <Badge variant={reg.paymentStatus === 'approved' ? 'default' : reg.paymentStatus === 'rejected' ? 'destructive' : 'secondary'}>
                                  {reg.paymentStatus}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
