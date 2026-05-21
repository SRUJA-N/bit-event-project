import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetEvent, getGetEventQueryKey, useListEventRegistrations, getListEventRegistrationsQueryKey, useReviewRegistration } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Check, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Registration } from "@workspace/api-client-react/src/generated/api.schemas";

export function ReviewRegistrations() {
  const [, params] = useRoute("/faculty/events/:id/registrations");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null);

  const { data: event, isLoading: isEventLoading } = useGetEvent(id, {
    query: {
      enabled: !!id,
      queryKey: getGetEventQueryKey(id)
    }
  });

  const { data: registrations, isLoading: isRegLoading } = useListEventRegistrations(id, {
    query: {
      enabled: !!id,
      queryKey: getListEventRegistrationsQueryKey(id)
    }
  });

  const reviewMutation = useReviewRegistration();

  const handleReviewClick = (reg: Registration, reviewAction: 'approved' | 'rejected') => {
    setSelectedReg(reg);
    setAction(reviewAction);
    setAdminComment(reviewAction === 'rejected' ? "Transaction details do not match" : "Payment verified");
    setIsReviewOpen(true);
  };

  const submitReview = () => {
    if (!selectedReg || !action) return;

    reviewMutation.mutate({
      id: selectedReg.id,
      data: {
        paymentStatus: action,
        adminComment: adminComment || null
      }
    }, {
      onSuccess: () => {
        toast({
          title: `Registration ${action}`,
          description: `The student has been notified.`,
        });
        setIsReviewOpen(false);
        queryClient.invalidateQueries({ queryKey: getListEventRegistrationsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
      },
      onError: (err) => {
        toast({
          title: "Failed to update",
          description: err.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  if (isEventLoading || isRegLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!event) return <div>Event not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/faculty/dashboard">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/20">
            <ArrowLeft className="h-4 w-4 text-primary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Review Registrations</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.totalSlots}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Available Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{event.availableSlots}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Registration Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Students</CardTitle>
        </CardHeader>
        <CardContent>
          {!registrations || registrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No registrations found for this event.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Registered At</TableHead>
                    {event.registrationFee > 0 && <TableHead>Payment Proof</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="font-medium">{reg.student?.name}</div>
                        <div className="text-xs text-muted-foreground">{reg.student?.email}</div>
                      </TableCell>
                      <TableCell>{reg.student?.department}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(reg.registeredAt), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      {event.registrationFee > 0 && (
                        <TableCell>
                          {reg.paymentScreenshotUrl ? (
                            <a href={reg.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1 text-sm">
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">Not provided</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={
                          reg.paymentStatus === 'approved' ? 'bg-green-500 hover:bg-green-600' :
                          reg.paymentStatus === 'rejected' ? 'bg-destructive' :
                          'bg-amber-500 text-white hover:bg-amber-600'
                        }>
                          {reg.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.paymentStatus === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleReviewClick(reg, 'approved')}
                              data-testid={`button-approve-${reg.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleReviewClick(reg, 'rejected')}
                              data-testid={`button-reject-${reg.id}`}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Reviewed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approved' ? "Approve Registration" : "Reject Registration"}
            </DialogTitle>
            <DialogDescription>
              Reviewing registration for {selectedReg?.student?.name}. 
              {action === 'approved' ? " This will decrement the available slots." : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {event.registrationFee > 0 && selectedReg?.paymentScreenshotUrl && (
              <div className="mb-4">
                <Label>Payment Screenshot</Label>
                <div className="mt-2 border rounded-md p-2 bg-muted/20">
                  <img 
                    src={selectedReg.paymentScreenshotUrl} 
                    alt="Payment proof" 
                    className="max-h-64 object-contain mx-auto" 
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Admin Comment (visible to student)</Label>
              <Input 
                value={adminComment} 
                onChange={(e) => setAdminComment(e.target.value)} 
                placeholder="Optional feedback..."
                data-testid="input-admin-comment"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
            <Button 
              onClick={submitReview} 
              variant={action === 'rejected' ? 'destructive' : 'default'}
              className={action === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              disabled={reviewMutation.isPending}
              data-testid="button-confirm-review"
            >
              {reviewMutation.isPending ? "Saving..." : `Confirm ${action}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
