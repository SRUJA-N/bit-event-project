import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetEvent, getGetEventQueryKey, useSubmitFeedback } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft } from "lucide-react";
import { useState } from "react";

const feedbackSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comments: z.string().optional(),
});

export function Feedback() {
  const [, params] = useRoute("/events/:id/feedback");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);

  const { data: event, isLoading: isEventLoading } = useGetEvent(id, {
    query: {
      enabled: !!id,
      queryKey: getGetEventQueryKey(id)
    }
  });

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      comments: "",
    },
  });

  const submitFeedback = useSubmitFeedback();

  const onSubmit = (values: z.infer<typeof feedbackSchema>) => {
    submitFeedback.mutate({
      data: {
        eventId: id,
        rating: values.rating,
        comments: values.comments
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Feedback submitted",
          description: "Thank you for your feedback!",
        });
        setLocation("/my-registrations");
      },
      onError: (err) => {
        toast({
          title: "Submission failed",
          description: err.message || "Failed to submit feedback.",
          variant: "destructive"
        });
      }
    });
  };

  if (isEventLoading) return <div>Loading...</div>;
  if (!event) return <div>Event not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/my-registrations" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Registrations
      </Link>

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Event Feedback</CardTitle>
          <CardDescription>
            Share your experience for <span className="font-semibold text-foreground">{event.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base">How would you rate this event?</FormLabel>
                    <FormControl>
                      <div className="flex gap-2" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => field.onChange(star)}
                          >
                            <Star 
                              className={`w-10 h-10 ${
                                (hoverRating || field.value) >= star 
                                  ? 'fill-accent text-accent' 
                                  : 'text-muted-foreground/30'
                              } transition-colors`} 
                            />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What did you like? What could be improved?" 
                        className="min-h-[120px] resize-y"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg" 
                disabled={submitFeedback.isPending}
                data-testid="button-submit-feedback"
              >
                {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
