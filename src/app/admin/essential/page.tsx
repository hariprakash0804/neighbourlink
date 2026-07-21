"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Building2,
  Pill,
  Shield,
  Flame,
  Film,
  GraduationCap,
  CreditCard,
  Landmark,
  ArrowLeft,
  AlertCircle,
  Search,
  FileSpreadsheet,
  Upload,
  Download,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import * as XLSX from "xlsx";

// Category config to match constant values
const ESSENTIAL_CATEGORIES = [
  { value: "HOSPITAL", label: "Hospital / Clinic", icon: Building2, color: "#ef4444" },
  { value: "PHARMACY", label: "Pharmacy", icon: Pill, color: "#10b981" },
  { value: "POLICE", label: "Police Station", icon: Shield, color: "#3b82f6" },
  { value: "FIRE", label: "Fire Station", icon: Flame, color: "#f97316" },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: Film, color: "#8b5cf6" },
  { value: "SCHOOL", label: "School & College", icon: GraduationCap, color: "#06b6d4" },
  { value: "ATM", label: "ATM Booth", icon: CreditCard, color: "#14b8a6" },
  { value: "BANK", label: "Bank Branch", icon: Landmark, color: "#6366f1" },
] as const;

export default function AdminEssentialPage() {
  const router = useRouter();

  // Queries & Mutations
  const { data, isLoading, refetch } = trpc.admin.listAllEssentialServices.useQuery();
  const createServiceMutation = trpc.admin.createEssentialService.useMutation();
  const deleteServiceMutation = trpc.admin.deleteEssentialService.useMutation();
  const bulkCreateMutation = trpc.admin.bulkCreateEssentialServices.useMutation();

  const services = data?.services || [];

  // Import / Bulk Upload state
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const handleDownloadTemplate = () => {
    const headers = [["name", "category", "lat", "lng", "phone", "is24x7", "isGovtSource"]];
    const sampleRows = [
      ["Apollo Clinic", "HOSPITAL", 12.9723, 77.5898, "080 2222 4561", "TRUE", "FALSE"],
      ["MG Road Pharmacy", "PHARMACY", 12.9741, 77.6083, "1860 500 0101", "TRUE", "FALSE"],
      ["City Police Station", "POLICE", 12.9739, 77.5901, "080 2294 2583", "TRUE", "TRUE"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "essential_services_template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportSuccess("");
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any>(ws);

        if (rows.length === 0) {
          throw new Error("The uploaded sheet is empty.");
        }

        // Validate and map rows
        const parsedServices = rows.map((row: any, index: number) => {
          const rowNum = index + 2;
          
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find(
                (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === key.toLowerCase()
              );
              if (matchedKey) return row[matchedKey];
            }
            return undefined;
          };

          const rawName = getVal(["name", "title", "serviceName"]);
          const rawCategory = getVal(["category", "type"]);
          const rawLat = getVal(["lat", "latitude"]);
          const rawLng = getVal(["lng", "longitude", "long"]);
          const rawPhone = getVal(["phone", "contact", "phoneNumber", "tel"]);
          const rawIs24x7 = getVal(["is24x7", "open247", "247"]);
          const rawIsGovt = getVal(["isgovt", "isgovtsource", "govt"]);

          if (!rawName) throw new Error(`Row ${rowNum}: Name is missing.`);
          if (!rawCategory) throw new Error(`Row ${rowNum}: Category is missing.`);
          
          const categoryVal = String(rawCategory).trim().toUpperCase();
          const validCategories = ["HOSPITAL", "PHARMACY", "POLICE", "FIRE", "ENTERTAINMENT", "SCHOOL", "ATM", "BANK"];
          if (!validCategories.includes(categoryVal)) {
            throw new Error(`Row ${rowNum}: Invalid category "${rawCategory}". Must be one of: ${validCategories.join(", ")}.`);
          }

          const parsedLat = parseFloat(String(rawLat));
          const parsedLng = parseFloat(String(rawLng));

          if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
            throw new Error(`Row ${rowNum}: Invalid latitude "${rawLat}".`);
          }
          if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
            throw new Error(`Row ${rowNum}: Invalid longitude "${rawLng}".`);
          }

          const is24x7Val = String(rawIs24x7).trim().toUpperCase() === "TRUE" || String(rawIs24x7) === "1";
          const isGovtVal = String(rawIsGovt).trim().toUpperCase() === "TRUE" || String(rawIsGovt) === "1";

          return {
            name: String(rawName).trim(),
            category: categoryVal as any,
            lat: parsedLat,
            lng: parsedLng,
            phone: rawPhone ? String(rawPhone).trim() : "N/A",
            is24x7: is24x7Val,
            isGovtSource: isGovtVal,
          };
        });

        const result = await bulkCreateMutation.mutateAsync({ services: parsedServices });
        setImportSuccess(`Successfully imported ${result.count} essential services!`);
        refetch();
      } catch (err: any) {
        setImportError(err.message || "Failed to parse file. Please verify column headers.");
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setImportError("Error reading file.");
      setImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  // Form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<typeof ESSENTIAL_CATEGORIES[number]["value"]>("HOSPITAL");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState<string>("12.9716");
  const [lng, setLng] = useState<string>("77.5946");
  const [is24x7, setIs24x7] = useState(false);
  const [isGovtSource, setIsGovtSource] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Service name is required.");
      return;
    }
    if (!phone.trim()) {
      setFormError("Contact number is required.");
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      setFormError("Please enter a valid latitude (-90 to 90).");
      return;
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      setFormError("Please enter a valid longitude (-180 to 180).");
      return;
    }

    setSubmitting(true);
    try {
      await createServiceMutation.mutateAsync({
        category,
        name: name.trim(),
        phone: phone.trim(),
        lat: latitude,
        lng: longitude,
        is24x7,
        isGovtSource,
      });

      // Clear and close
      setName("");
      setPhone("");
      setLat("12.9716");
      setLng("77.5946");
      setIs24x7(false);
      setIsGovtSource(false);
      setIsAddModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err.message || "Failed to create service.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"?`)) return;

    try {
      await deleteServiceMutation.mutateAsync({ serviceId });
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to delete service.");
    }
  };

  // Filter list
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "ALL" || s.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryMeta = (catVal: string) => {
    return ESSENTIAL_CATEGORIES.find((c) => c.value === catVal) || ESSENTIAL_CATEGORIES[0];
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-white/5 bg-surface-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 relative">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-surface-secondary px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all shadow-sm select-none mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-primary/10 p-3 border border-brand-primary/20 text-brand-primary">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-tight">Essential Services Management</h1>
                <p className="text-xs text-text-secondary mt-1">
                  Add, view, and delete public emergency listings like Hospitals, Fire Stations, and Police desks.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push("/admin/vendors")}
                className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all h-9 select-none"
              >
                Verification Queue
              </button>
              <button
                onClick={() => router.push("/admin/moderation")}
                className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all h-9 select-none"
              >
                Moderation Queue
              </button>
              <button
                onClick={() => router.push("/admin/audit-logs")}
                className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all h-9 select-none"
              >
                Audit Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full rounded-xl py-2 pl-9 pr-4 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="rounded-xl py-2 px-3 text-xs glass border border-white/5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary h-8"
            >
              <option value="ALL">All Categories</option>
              {ESSENTIAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-primary hover:brightness-110 text-white px-4 py-2.5 text-xs font-bold shadow-md select-none transition-all shrink-0 w-full md:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            <span>Add Essential Service</span>
          </button>
        </div>

        {/* Bulk Upload Panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass border border-white/5 rounded-2xl p-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Bulk Import via Excel / CSV</span>
            </h3>
            <p className="text-[10px] text-text-muted">
              Download our template sheet, populate it with data, and upload it to import in bulk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Download Template Button */}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary px-4 py-2 transition-all h-9 select-none w-full md:w-auto justify-center"
            >
              <Download className="h-4 w-4 text-brand-primary" />
              <span>Download Template</span>
            </button>

            {/* File Upload Button */}
            <label className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold shadow-md cursor-pointer select-none transition-all h-9 w-full md:w-auto justify-center">
              {importing ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Sheet</span>
                </>
              )}
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Import Feedback Banner */}
        {(importError || importSuccess) && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              importError
                ? "bg-danger/15 border-danger/20 text-danger"
                : "bg-success/15 border-success/20 text-success"
            }`}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{importError || importSuccess}</span>
          </div>
        )}

        {/* Content Table */}
        <div className="clay-card overflow-hidden border border-white/5 rounded-2xl">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-2">
              <AlertCircle className="h-8 w-8 text-text-muted mx-auto opacity-50" />
              <p className="text-sm font-bold text-text-primary">No services found</p>
              <p className="text-xs text-text-muted">
                Add a new essential service using the button above or search for another term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[11px] uppercase tracking-wider text-text-muted font-bold">
                    <th className="p-4">Service Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Coordinates</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Rules</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredServices.map((service) => {
                    const meta = getCategoryMeta(service.category);
                    const CatIcon = meta.icon;
                    return (
                      <tr key={service.id} className="text-xs hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-bold text-text-primary">
                          {service.name}
                        </td>
                        <td className="p-4">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${meta.color}15`,
                              borderColor: `${meta.color}25`,
                              color: meta.color,
                            }}
                          >
                            <CatIcon className="h-3 w-3" />
                            <span>{meta.label}</span>
                          </span>
                        </td>
                        <td className="p-4 text-text-secondary font-mono">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-text-muted" />
                            <span>{service.lat.toFixed(5)}, {service.lng.toFixed(5)}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-text-primary">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-brand-primary" />
                            <span>{service.phone || "N/A"}</span>
                          </div>
                        </td>
                        <td className="p-4 space-x-1.5">
                          {service.is24x7 && (
                            <span className="rounded bg-success/15 px-2 py-0.5 text-[9px] font-extrabold text-success border border-success/10">
                              24/7
                            </span>
                          )}
                          {service.isGovtSource && (
                            <span className="rounded bg-verified-blue/15 px-2 py-0.5 text-[9px] font-extrabold text-verified-blue border border-verified-blue/10">
                              GOVT
                            </span>
                          )}
                          {!service.is24x7 && !service.isGovtSource && (
                            <span className="text-[10px] text-text-muted font-medium">Standard</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteService(service.id, service.name)}
                            disabled={deleteServiceMutation.isPending}
                            className="p-2 text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-xl transition-all disabled:opacity-50"
                            title="Delete Service"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-background-overlay backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="clay-card p-6 w-full max-w-md mx-auto relative overflow-hidden text-text-primary border border-white/10 z-10"
            >
              <div className="mb-4">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-brand-primary" /> Add Essential Service
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Populate emergency facilities, schools, police hubs, or banks.
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-danger/15 border border-danger/20 text-danger text-[11px] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Service Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apollo Hospital, Cunningham Road"
                    className="w-full rounded-xl py-2 px-3 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted text-text-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full rounded-xl py-2 px-3 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary"
                    >
                      {ESSENTIAL_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value} className="bg-surface-primary">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 080 1234 5678"
                      className="w-full rounded-xl py-2 px-3 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted text-text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Latitude</label>
                    <input
                      type="text"
                      required
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="e.g. 12.9716"
                      className="w-full rounded-xl py-2 px-3 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted font-mono text-text-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Longitude</label>
                    <input
                      type="text"
                      required
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="e.g. 77.5946"
                      className="w-full rounded-xl py-2 px-3 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted font-mono text-text-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={is24x7}
                      onChange={(e) => setIs24x7(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-brand-primary focus:ring-0 cursor-pointer h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-semibold text-text-secondary">Open 24/7</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isGovtSource}
                      onChange={(e) => setIsGovtSource(e.target.checked)}
                      className="rounded border-white/10 bg-white/5 text-brand-primary focus:ring-0 cursor-pointer h-3.5 w-3.5"
                    />
                    <span className="text-[11px] font-semibold text-text-secondary">Government Source</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl border border-white/5 px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all select-none disabled:opacity-50"
                  >
                    {submitting ? "Adding..." : "Add Service"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
