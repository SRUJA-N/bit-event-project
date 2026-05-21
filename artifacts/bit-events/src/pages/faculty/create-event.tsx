import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateEvent } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileImage } from "lucide-react";

const createEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  venue: z.string().min(1, "Venue is required"),
  department: z.enum(["CSE-ICB", "CSE", "ISE", "ECE", "AI&ML", "ME", "CV"]),
  rules: z.string().optional(),
  registrationFee: z.coerce.number().min(0, "Fee cannot be negative"),
  totalSlots: z.coerce.number().min(1, "Must have at least 1 slot"),
  paymentQrUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export function CreateEvent() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      venue: "",
      department: "CSE-ICB",
      rules: "",
      registrationFee: 0,
      totalSlots: 50,
      paymentQrUrl: "",
    },
  });

  const fee = form.watch("registrationFee");
  const createEventMutation = useCreateEvent();

  const onSubmit = async (values: z.infer<typeof createEventSchema>) => {
    if (values.registrationFee > 0 && !values.paymentQrUrl) {
      form.setError("paymentQrUrl", { type: "manual", message: "QR Code URL is required for paid events" });
      return;
    }

    let imageUrl = null;

    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/uploads/event-banner", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        if (!res.ok) throw new Error("Upload failed");
        
        const data = await res.json();
        imageUrl = data.url;
      } catch (err) {
        setUploading(false);
        toast({
          title: "Upload failed",
          description: "Could not upload the banner image.",
          variant: "destructive"
        });
        return;
      }
      setUploading(false);
    }

    createEventMutation.mutate({
      data: {
        ...values,
        paymentQrUrl: values.paymentQrUrl || null,
        rules: values.rules || null,
        imageUrl,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Event created successfully",
          description: "Your event has been created and is pending admin approval.",
        });
        setLocation("/faculty/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Failed to create event",
          description: error.message || "An error occurred",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/faculty/dashboard">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/20">
            <ArrowLeft className="h-4 w-4 text-primary" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Create New Event</h1>
          <p className="text-muted-foreground">Fill in the details to publish a new event for students.</p>
        </div>
      </div>

      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle>Event Information</CardTitle>
          <CardDescription>Events require admin approval before becoming visible to students.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. HackWeb3.0 - The Blockchain Hackathon" className="text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the event, what students will learn, etc." 
                          className="min-h-[100px] resize-y"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Main Auditorium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dept" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CSE-ICB">CSE-ICB</SelectItem>
                          <SelectItem value="CSE">CSE</SelectItem>
                          <SelectItem value="ISE">ISE</SelectItem>
                          <SelectItem value="ECE">ECE</SelectItem>
                          <SelectItem value="AI&ML">AI&ML</SelectItem>
                          <SelectItem value="ME">ME</SelectItem>
                          <SelectItem value="CV">CV</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="md:col-span-2 space-y-2">
                  <Label>Event Banner Image (Optional)</Label>
                  <div className="flex items-center gap-4 border p-4 rounded-lg bg-muted/30">
                    <Input
                      id="banner"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Image
                    </Button>
                    <div className="flex-1 text-sm text-muted-foreground truncate">
                      {file ? (
                        <span className="flex items-center gap-2 text-primary font-medium">
                          <FileImage className="h-4 w-4" /> {file.name}
                        </span>
                      ) : (
                        "No file chosen. 16:9 aspect ratio recommended."
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Registration Details</h3>
                </div>

                <FormField
                  control={form.control}
                  name="totalSlots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Slots</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>Maximum number of students allowed</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Fee (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormDescription>Set to 0 for free events</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fee > 0 && (
                  <FormField
                    control={form.control}
                    name="paymentQrUrl"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <FormLabel className="text-amber-900 flex items-center gap-2">
                          Payment QR Code Image URL
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/my-upi-qr.png" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription className="text-amber-700/80">
                          Provide a direct link to an image of your UPI QR code. Students will scan this to pay the fee.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="rules"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 pt-4">
                      <FormLabel>Rules & Guidelines (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any prerequisites, rules, or guidelines for attendees." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Link href="/faculty/dashboard">
                  <Button type="button" variant="outline" className="px-8">Cancel</Button>
                </Link>
                <Button 
                  type="submit" 
                  className="px-8 bg-primary text-primary-foreground hover:bg-primary/90" 
                  disabled={createEventMutation.isPending || uploading}
                  data-testid="button-submit-event"
                >
                  {uploading ? "Uploading Image..." : createEventMutation.isPending ? "Creating..." : "Submit Event"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
