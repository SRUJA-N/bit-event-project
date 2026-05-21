import { useState } from "react";
import { Link } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Calendar, Clock, Users } from "lucide-react";
import { format } from "date-fns";

export function StudentHome() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string | undefined>(undefined);

  const { data: events, isLoading } = useListEvents(
    { status: "approved", search: search || undefined, department },
    { query: { queryKey: getListEventsQueryKey({ status: "approved", search: search || undefined, department }) } }
  );

  return (
    <div className="space-y-8">
      <section className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 mb-4 px-3 py-1">CSE-ICB Department</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Discover BIT Events</h1>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Explore workshops, hackathons, and seminars hosted by the Bangalore Institute of Technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events by title..." 
                className="pl-10 bg-background text-foreground border-transparent focus-visible:ring-accent h-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={department === "CSE-ICB" ? "secondary" : "outline"} 
                className={department === "CSE-ICB" ? "bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-6" : "bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-6"}
                onClick={() => setDepartment(department === "CSE-ICB" ? undefined : "CSE-ICB")}
                data-testid="button-filter-cse-icb"
              >
                CSE-ICB Only
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upcoming Events</h2>
          <span className="text-muted-foreground text-sm font-medium">
            {events?.length || 0} events found
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            {(search || department) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setSearch(""); setDepartment(undefined); }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event) => (
              <Card key={event.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group border-border/60">
                <div className="h-48 bg-muted relative overflow-hidden">
                  {event.imageUrl ? (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20">
                      <Calendar className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {event.registrationFee === 0 ? (
                      <Badge className="bg-green-500 hover:bg-green-600 shadow-sm text-white">Free</Badge>
                    ) : (
                      <Badge className="bg-primary text-primary-foreground shadow-sm">₹{event.registrationFee}</Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground shadow-sm">
                      {event.department}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <h3 className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors" title={event.title}>
                    {event.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="flex items-start gap-2 mb-4 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{event.venue}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{event.availableSlots} <span className="text-muted-foreground font-normal">of {event.totalSlots} slots left</span></span>
                  </div>
                  
                  {event.availableSlots > 0 && event.availableSlots <= 10 && (
                    <p className="text-xs text-destructive mt-2 font-medium">Hurry! Almost full.</p>
                  )}
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Link href={`/events/${event.id}`} className="w-full">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                      disabled={event.availableSlots === 0}
                      data-testid={`button-view-event-${event.id}`}
                    >
                      {event.availableSlots === 0 ? "Sold Out" : "View Details"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
