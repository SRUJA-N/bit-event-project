import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, IndianRupee, Users, Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = ["#1a2a5e", "#c8960c", "#2e7d32", "#c62828", "#0288d1", "#6a1b9a"];
const STATUS_COLORS: Record<string, string> = {
  approved: "#2e7d32",
  pending: "#c8960c",
  rejected: "#c62828",
};

interface AnalyticsData {
  perEvent: {
    title: string;
    shortTitle: string;
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
    rejectedRegistrations: number;
    revenue: number;
    avgRating: number | null;
    feedbackCount: number;
  }[];
  statusBreakdown: { name: string; value: number }[];
  departmentBreakdown: { department: string; events: number; registrations: number; revenue: number }[];
  totals: { totalRevenue: number; totalRegistrations: number; approvedRegistrations: number; avgRating: number | null };
}

function useAnalytics(token: string | null) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    enabled: !!token,
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const [eventsRes, registrationsRes, feedbackRes] = await Promise.all([
        fetch("/api/events", { headers }).then(r => r.json()),
        fetch("/api/analytics/registrations", { headers }).then(r => r.json()),
        fetch("/api/analytics/feedback", { headers }).then(r => r.json()),
      ]);

      const events: any[] = eventsRes;
      const registrations: any[] = registrationsRes;
      const feedbackItems: any[] = feedbackRes;

      const eventMap = new Map(events.map((e: any) => [e.id, e]));

      const approved = registrations.filter((r: any) => r.paymentStatus === "approved");
      const pending = registrations.filter((r: any) => r.paymentStatus === "pending");
      const rejected = registrations.filter((r: any) => r.paymentStatus === "rejected");

      const totalRevenue = approved.reduce((sum: number, r: any) => {
        const ev = eventMap.get(r.eventId);
        return sum + (ev?.registrationFee ?? 0);
      }, 0);

      const allRatings = feedbackItems.map((f: any) => f.rating).filter(Boolean);
      const avgRatingGlobal = allRatings.length ? +(allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length).toFixed(1) : null;

      const perEvent = events.map((ev: any) => {
        const regs = registrations.filter((r: any) => r.eventId === ev.id);
        const approvedRegs = regs.filter((r: any) => r.paymentStatus === "approved");
        const pendingRegs = regs.filter((r: any) => r.paymentStatus === "pending");
        const rejectedRegs = regs.filter((r: any) => r.paymentStatus === "rejected");
        const revenue = approvedRegs.length * ev.registrationFee;
        const evFeedback = feedbackItems.filter((f: any) => f.eventId === ev.id);
        const ratings = evFeedback.map((f: any) => f.rating).filter(Boolean);
        const avgRating = ratings.length ? +(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;
        const words = ev.title.split(" ");
        const shortTitle = words.slice(0, 2).join(" ") + (words.length > 2 ? "…" : "");
        return {
          title: ev.title,
          shortTitle,
          totalRegistrations: regs.length,
          approvedRegistrations: approvedRegs.length,
          pendingRegistrations: pendingRegs.length,
          rejectedRegistrations: rejectedRegs.length,
          revenue,
          avgRating,
          feedbackCount: evFeedback.length,
        };
      });

      const deptMap = new Map<string, { events: number; registrations: number; revenue: number }>();
      for (const ev of events) {
        if (!deptMap.has(ev.department)) deptMap.set(ev.department, { events: 0, registrations: 0, revenue: 0 });
        const d = deptMap.get(ev.department)!;
        d.events++;
        const regs = registrations.filter((r: any) => r.eventId === ev.id && r.paymentStatus === "approved");
        d.registrations += regs.length;
        d.revenue += regs.length * ev.registrationFee;
      }
      const departmentBreakdown = Array.from(deptMap.entries()).map(([department, data]) => ({ department, ...data }));

      const statusBreakdown = [
        { name: "Approved", value: approved.length },
        { name: "Pending", value: pending.length },
        { name: "Rejected", value: rejected.length },
      ].filter(s => s.value > 0);

      return {
        perEvent,
        statusBreakdown,
        departmentBreakdown,
        totals: {
          totalRevenue,
          totalRegistrations: registrations.length,
          approvedRegistrations: approved.length,
          avgRating: avgRatingGlobal,
        },
      };
    },
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-primary mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <strong>{p.name === "Revenue" ? `₹${p.value}` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export function AdminAnalytics() {
  const { token } = useAuth();
  const { data, isLoading, error } = useAnalytics(token);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 text-destructive">
        Failed to load analytics data.
      </div>
    );
  }

  const { perEvent, statusBreakdown, departmentBreakdown, totals } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform-wide revenue, attendance, and engagement insights.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">₹{totals.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From approved registrations</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.approvedRegistrations} approved</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {totals.totalRegistrations > 0
                ? `${Math.round((totals.approvedRegistrations / totals.totalRegistrations) * 100)}%`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registrations confirmed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Feedback Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {totals.avgRating !== null ? `${totals.avgRating} / 5` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all events</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Event */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Event</CardTitle>
          <CardDescription>Total revenue collected from approved registrations per event.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perEvent} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="shortTitle" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#c8960c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Registration Breakdown per Event */}
      <Card>
        <CardHeader>
          <CardTitle>Registrations per Event</CardTitle>
          <CardDescription>Breakdown of registration statuses across all events.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perEvent} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="shortTitle" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="approvedRegistrations" name="Approved" stackId="a" fill="#2e7d32" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pendingRegistrations"  name="Pending"  stackId="a" fill="#c8960c" />
              <Bar dataKey="rejectedRegistrations" name="Rejected" stackId="a" fill="#c62828" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Registration Status</CardTitle>
            <CardDescription>Platform-wide distribution of all registration statuses.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toLowerCase()] ?? COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 flex-wrap justify-center">
              {statusBreakdown.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-sm">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.name.toLowerCase()] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <strong>{s.value}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Department</CardTitle>
            <CardDescription>Revenue and registrations grouped by department.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={departmentBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 12 }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#1a2a5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-event feedback radar */}
      {perEvent.some(e => e.avgRating !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Ratings by Event</CardTitle>
            <CardDescription>Average student rating (out of 5) per event based on submitted feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={perEvent.filter(e => e.avgRating !== null)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="shortTitle" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Radar name="Avg Rating" dataKey="avgRating" stroke="#c8960c" fill="#c8960c" fillOpacity={0.35} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Event table summary */}
      <Card>
        <CardHeader>
          <CardTitle>Event Summary Table</CardTitle>
          <CardDescription>Detailed breakdown of all events and their key metrics.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 font-semibold">Event</th>
                <th className="text-center py-3 px-4 font-semibold">Total Reg.</th>
                <th className="text-center py-3 px-4 font-semibold">Approved</th>
                <th className="text-center py-3 px-4 font-semibold">Pending</th>
                <th className="text-center py-3 px-4 font-semibold">Rejected</th>
                <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                <th className="text-center py-3 px-4 font-semibold">Rating</th>
              </tr>
            </thead>
            <tbody>
              {perEvent.map((ev, i) => (
                <tr key={i} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-muted/10"} hover:bg-muted/20 transition-colors`}>
                  <td className="py-3 px-4 font-medium text-primary max-w-[180px] truncate" title={ev.title}>{ev.title}</td>
                  <td className="py-3 px-4 text-center">{ev.totalRegistrations}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{ev.approvedRegistrations}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">{ev.pendingRegistrations}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{ev.rejectedRegistrations}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-green-700">₹{ev.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    {ev.avgRating !== null
                      ? <span className="flex items-center justify-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{ev.avgRating}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
