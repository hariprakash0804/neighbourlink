"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  AlertTriangle,
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Trash2,
  Image as ImageIcon,
  Clock,
  User as UserIcon,
  Tag,
  Building,
  UploadCloud,
  ChevronRight,
  Eye,
  CheckCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";

export default function CommunityHubPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"bulletin" | "civic" | "events">("bulletin");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Default coordinates ( Bangalore )
  const [userLocation, setUserLocation] = useState({
    lat: 12.9716,
    lng: 77.5946,
    locality: "Bangalore",
  });

  // Load user's addresses
  const { data: addresses } = trpc.location.getAddresses.useQuery(undefined, {
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      setUserLocation({
        lat: addresses[0].lat,
        lng: addresses[0].lng,
        locality: addresses[0].label,
      });
    }
  }, [addresses]);

  // ─── Creation States ────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ─── tRPC Queries & Mutations ───────────────────────────────────────────────
  // Bulletin
  const { data: bulletinData, refetch: refetchBulletin } = trpc.bulletin.list.useQuery(
    { page: 1, limit: 30 },
    { enabled: activeTab === "bulletin" }
  );
  const createBulletin = trpc.bulletin.create.useMutation({
    onSuccess: () => {
      setIsFormOpen(false);
      resetForm();
      refetchBulletin();
    },
  });
  const deleteBulletin = trpc.bulletin.delete.useMutation({
    onSuccess: () => refetchBulletin(),
  });

  // Civic
  const { data: civicData, refetch: refetchCivic } = trpc.civic.listNearby.useQuery(
    { lat: userLocation.lat, lng: userLocation.lng, radius: 5000 },
    { enabled: activeTab === "civic" }
  );
  const createCivic = trpc.civic.reportIssue.useMutation({
    onSuccess: () => {
      setIsFormOpen(false);
      resetForm();
      refetchCivic();
    },
  });
  const updateCivicStatus = trpc.civic.updateStatus.useMutation({
    onSuccess: () => refetchCivic(),
  });

  // Events
  const { data: eventsData, refetch: refetchEvents } = trpc.events.list.useQuery(
    { page: 1, limit: 30 },
    { enabled: activeTab === "events" }
  );
  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      setIsFormOpen(false);
      resetForm();
      refetchEvents();
    },
  });
  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => refetchEvents(),
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setVenue("");
    setStartDate("");
    setEndDate("");
    setUploadedUrl(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setUploadedUrl(data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      if (activeTab === "bulletin") {
        await createBulletin.mutateAsync({
          category: (category || "GENERAL") as any,
          title,
          content,
          photoUrl: uploadedUrl || undefined,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });
      } else if (activeTab === "civic") {
        await createCivic.mutateAsync({
          category: category || "Other",
          description: content,
          photoUrl: uploadedUrl || undefined,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });
      } else if (activeTab === "events") {
        await createEvent.mutateAsync({
          title,
          description: content,
          venue,
          category: (category || "OTHER") as any,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          photoUrl: uploadedUrl || undefined,
          lat: userLocation.lat,
          lng: userLocation.lng,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("minio://")) {
      const key = url.replace("minio://", "");
      return `http://localhost:9000/neighborlink-docs/${key}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Header Banner */}
      <div className="relative overflow-hidden border-b border-white/5 bg-surface-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-8 relative flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-brand-primary" />
              Community Hub
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Join neighbor bulletin boards, report local civic issues, or coordinate upcoming community events.
            </p>
          </div>
          <button
            onClick={() => {
              if (!session?.user) {
                setIsAuthModalOpen(true);
              } else {
                setIsFormOpen(true);
              }
            }}
            className="flex items-center gap-1.5 rounded-xl bg-brand-primary hover:brightness-110 text-white px-4 py-2.5 text-xs font-bold shadow-md select-none transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-1 p-1 glass rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("bulletin")}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
              activeTab === "bulletin"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Megaphone className="h-4 w-4" />
            <span>Bulletin Board</span>
          </button>
          <button
            onClick={() => setActiveTab("civic")}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
              activeTab === "civic"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Civic Issues</span>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
              activeTab === "events"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Local Events</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Tab 1: Bulletin Board */}
        {activeTab === "bulletin" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {bulletinData?.posts.map((post) => (
              <div key={post.id} className="clay-card p-4 border border-white/5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
                      {post.category}
                    </span>
                    {session?.user && post.userId === session.user.id && (
                      <button
                        onClick={() => deleteBulletin.mutate({ postId: post.id })}
                        className="text-text-secondary hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-text-primary leading-snug">{post.title}</h3>
                  <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  {post.photoUrl && (
                    <img
                      src={formatImageUrl(post.photoUrl)}
                      alt={post.title}
                      className="rounded-xl max-h-48 w-full object-cover border border-white/10 mt-2"
                    />
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-text-secondary/60">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {post.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {bulletinData?.posts.length === 0 && (
              <div className="col-span-2 text-center text-xs text-text-secondary py-16">
                No active bulletin board posts. Create one to get the word out!
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Civic Issues */}
        {activeTab === "civic" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {civicData?.reports.map((report) => (
              <div key={report.id} className="clay-card p-4 border border-white/5 flex flex-col md:flex-row gap-4 items-start">
                {report.photoUrl && (
                  <img
                    src={formatImageUrl(report.photoUrl)}
                    alt={report.category}
                    className="rounded-xl w-full md:w-32 h-24 object-cover border border-white/10 shrink-0"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 capitalize">
                      🚧 {report.category}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      report.status === "RESOLVED"
                        ? "bg-success/10 text-success border-success/20"
                        : report.status === "IN_PROGRESS"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {report.description || "No description provided."}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-text-secondary/60">
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      Reported by: {report.reporterName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand-primary" />
                      Distance: {report.distanceM}m away
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {/* Admin Status controls */}
                {session?.user?.role === "ADMIN" && (
                  <div className="flex flex-col gap-1.5 shrink-0 self-center">
                    <button
                      onClick={() => updateCivicStatus.mutate({ reportId: report.id, status: "IN_PROGRESS" })}
                      className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold transition-all border border-amber-500/20"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateCivicStatus.mutate({ reportId: report.id, status: "RESOLVED" })}
                      className="px-2 py-1 rounded bg-success/10 hover:bg-success/20 text-success text-[10px] font-bold transition-all border border-success/20"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
            {civicData?.reports.length === 0 && (
              <div className="text-center text-xs text-text-secondary py-16">
                No civic issues reported nearby. Keep your neighborhood beautiful by reporting potholes or garbage!
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Local Events */}
        {activeTab === "events" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid gap-4 md:grid-cols-2"
          >
            {eventsData?.events.map((event) => (
              <div key={event.id} className="clay-card p-4 border border-white/5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {event.category}
                    </span>
                    {session?.user && event.userId === session.user.id && (
                      <button
                        onClick={() => deleteEvent.mutate({ eventId: event.id })}
                        className="text-text-secondary hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-text-primary leading-snug">{event.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{event.description}</p>
                  
                  <div className="bg-white/5 p-2 rounded-lg space-y-1 text-[11px] border border-white/5">
                    <p className="text-text-secondary flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand-primary" />
                      Venue: <span className="text-text-primary font-semibold">{event.venue}</span>
                    </p>
                    <p className="text-text-secondary flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 text-cyan-400" />
                      Starts: <span className="text-text-primary font-semibold">{new Date(event.startDate).toLocaleString("en-IN")}</span>
                    </p>
                  </div>

                  {event.photoUrl && (
                    <img
                      src={formatImageUrl(event.photoUrl)}
                      alt={event.title}
                      className="rounded-xl max-h-48 w-full object-cover border border-white/10 mt-2"
                    />
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-text-secondary/60">
                  <span>Organizer: {event.authorName}</span>
                  <span>Created {new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {eventsData?.events.length === 0 && (
              <div className="col-span-2 text-center text-xs text-text-secondary py-16">
                No upcoming events calendar posted. Be the first to schedule a festival or RWA meeting!
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Creation Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="clay-card p-6 border border-white/10 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-brand-primary" />
                  <span>Create {activeTab === "bulletin" ? "Bulletin Post" : activeTab === "civic" ? "Civic Report" : "Event"}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {activeTab !== "civic" && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give it a brief title..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-primary/50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-surface-secondary border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary/50"
                    >
                      <option value="">Select Category</option>
                      {activeTab === "bulletin" && (
                        <>
                          <option value="GENERAL">General Bulletin</option>
                          <option value="ANNOUNCEMENT">Announcement</option>
                          <option value="LOST_FOUND">Lost & Found</option>
                          <option value="GARAGE_SALE">Garage Sale</option>
                        </>
                      )}
                      {activeTab === "civic" && (
                        <>
                          <option value="Pothole">Pothole</option>
                          <option value="Garbage">Garbage / Litter</option>
                          <option value="Streetlight">Streetlight Issues</option>
                          <option value="Water Leak">Water Leakage</option>
                          <option value="Stray Animals">Stray Animals</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                      {activeTab === "events" && (
                        <>
                          <option value="FESTIVAL">Festival / Celebration</option>
                          <option value="MEETING">RWA Meeting</option>
                          <option value="NOTICE">Official Notice</option>
                          <option value="OTHER">Other Gathering</option>
                        </>
                      )}
                    </select>
                  </div>

                  {activeTab === "events" && (
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-text-secondary/60 uppercase font-black">Venue</label>
                      <input
                        type="text"
                        required
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="RWA Hall, Central Park, etc."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {activeTab === "events" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-secondary/60 uppercase font-black">Start Date/Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-secondary/60 uppercase font-black">End Date/Time (Optional)</label>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black">
                    {activeTab === "civic" ? "Issue Description" : "Post Content"}
                  </label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write descriptions or details here..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-primary/50 resize-none"
                    rows={4}
                  />
                </div>

                {/* Photo Upload block */}
                <div className="space-y-2">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Attachment Image</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-1.5 px-4 py-2 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-xs font-semibold text-text-secondary">
                      <UploadCloud className="h-4 w-4" />
                      <span>{uploading ? "Uploading..." : "Select Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadedUrl && (
                      <span className="text-[10px] text-success font-bold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Uploaded
                      </span>
                    )}
                  </div>
                  {uploadedUrl && (
                    <img
                      src={formatImageUrl(uploadedUrl)}
                      alt="Preview"
                      className="rounded-xl max-h-36 max-w-full object-cover border border-white/10 mt-1"
                    />
                  )}
                </div>

                {(createBulletin.error || createCivic.error || createEvent.error) && (
                  <p className="text-xs text-red-400">
                    {createBulletin.error?.message || createCivic.error?.message || createEvent.error?.message}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={createBulletin.isPending || createCivic.isPending || createEvent.isPending}
                    className="flex-1 rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
