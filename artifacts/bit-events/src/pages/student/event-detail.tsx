import { useState, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetEvent, getGetEventQueryKey, useCreateRegistration } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Users, Building, ArrowLeft, Upload, FileImage, User } from "lucide-react";

export function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { token } = useAuth();
  const { toast } = useToast();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: event, isLoading } = useGetEvent(id, {
    query: {
      enabled: !!id,
      queryKey: getGetEventQueryKey(id)
    }
  });

  const createRegistration = useCreateRegistration();

  const handleRegister = async () => {
    if (event?.registrationFee && event.registrationFee > 0 && !file) {
      toast({
        title: "Missing screenshot",
        description: "Please upload your payment screenshot.",
        variant: "destructive"
      });
      return;
    }

    let screenshotUrl = null;

    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/uploads/payment-screenshot", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        if (!res.ok) throw new Error("Upload failed");
        
        const data = await res.json();
        screenshotUrl = data.url;
      } catch (err) {
        setUploading(false);
        toast({
          title: "Upload failed",
          description: "Could not upload the payment screenshot.",
          variant: "destructive"
        });
        return;
      }
      setUploading(false);
    }

    createRegistration.mutate({
      data: {
        eventId: id,
        paymentScreenshotUrl: screenshotUrl
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "Your registration has been submitted.",
        });
        setIsRegisterOpen(false);
        setLocation("/my-registrations");
      },
      onError: (err) => {
        toast({
          title: "Registration failed",
          description: err.message || "Failed to register for the event.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) return <div>Event not found.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Header Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-accent text-accent-foreground">{event.department}</Badge>
              {event.registrationFee === 0 ? (
                <Badge className="bg-green-500 text-white hover:bg-green-600">Free</Badge>
              ) : (
                <Badge className="bg-primary text-primary-foreground">₹{event.registrationFee}</Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">{event.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{event.description}</p>
          </div>

          {event.imageUrl && (
            <div className="rounded-xl overflow-hidden shadow-lg border">
              <img src={event.imageUrl} alt={event.title} className="w-full h-auto max-h-[400px] object-cover" />
            </div>
          )}

          {event.rules && (
            <div className="bg-muted/30 p-6 rounded-xl border">
              <h3 className="text-xl font-semibold mb-4">Rules & Guidelines</h3>
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none whitespace-pre-wrap">
                {event.rules}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24 border-primary/20 shadow-lg">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Venue</p>
                  <p className="text-sm text-muted-foreground">{event.venue}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">{event.department}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Coordinator</p>
                  <p className="text-sm text-muted-foreground">{event.createdByFacultyName || 'Faculty Coordinator'}</p>
                </div>
              </div>

              <div className="pt-4 border-t mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available Slots</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{event.availableSlots}</span>
                    <span className="text-sm text-muted-foreground">/ {event.totalSlots}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t pt-6">
              <Button 
                className="w-full h-12 text-lg font-medium" 
                onClick={() => setIsRegisterOpen(true)}
                disabled={event.availableSlots === 0}
                data-testid="button-open-register"
              >
                {event.availableSlots === 0 ? "Sold Out" : "Register Now"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register for {event.title}</DialogTitle>
            <DialogDescription>
              {event.registrationFee === 0 
                ? "This is a free event. Click confirm to secure your slot." 
                : `This event requires a fee of ₹${event.registrationFee}. Please scan the QR code to pay and upload a screenshot.`}
            </DialogDescription>
          </DialogHeader>

          {event.registrationFee > 0 && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center space-y-4">
                <p className="font-medium text-sm text-center">Scan to pay ₹{event.registrationFee}</p>
                {event.paymentQrUrl ? (
                  <img src={event.paymentQrUrl} alt="Payment QR Code" className="w-48 h-48 bg-white p-2 rounded border" />
                ) : (
                  <div className="w-48 h-48 bg-white border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    No QR Code provided
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenshot">Payment Screenshot</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    data-testid="input-file-screenshot"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {file ? file.name : "Choose File"}
                  </Button>
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                    <FileImage className="h-4 w-4" /> Screenshot attached ready for upload
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRegister} 
              disabled={createRegistration.isPending || uploading || (event.registrationFee > 0 && !file)}
              data-testid="button-confirm-register"
            >
              {uploading ? "Uploading..." : createRegistration.isPending ? "Confirming..." : "Confirm Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
