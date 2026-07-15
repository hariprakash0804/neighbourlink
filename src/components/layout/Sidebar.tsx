"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ESSENTIAL_CATEGORY_META, VENDOR_CATEGORY_META, type CategoryMeta } from "@/lib/constants";
import { ChevronRight, Building2, Wrench, History, Sparkles } from "lucide-react";

interface SidebarProps {
  className?: string;
}

function CategoryChip({
  category,
  isActive,
  onClick,
}: {
  category: CategoryMeta;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = category.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full rounded-2xl px-3.5 py-2.5 text-sm transition-all duration-200",
        isActive
          ? "neu-inset text-brand-primary font-semibold"
          : "hover:bg-white/50 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
          isActive
            ? "bg-brand-primary/10 shadow-sm"
            : "bg-surface-tertiary"
        )}
        style={isActive ? { color: category.color } : undefined}
      >
        <Icon className="h-4 w-4" style={{ color: isActive ? category.color : undefined }} />
      </div>
      <span className="truncate">{category.label}</span>
      {isActive && (
        <motion.div
          layoutId="sidebar-indicator"
          className="ml-auto"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <ChevronRight className="h-4 w-4 text-brand-primary" />
        </motion.div>
      )}
    </button>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeCategory = searchParams.get("category");
  
  const [essentialCollapsed, setEssentialCollapsed] = useState(false);
  const [vendorCollapsed, setVendorCollapsed] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [recentViewed, setRecentViewed] = useState<string[]>([]);

  // Load recently viewed categories from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nl_recent_categories");
      if (stored) setRecentViewed(JSON.parse(stored).slice(0, 3));
    } catch {
      // Ignore
    }
  }, []);

  // Get metadata for recently viewed categories
  const recentMeta = useMemo(() => {
    return recentViewed
      .map((val) =>
        ESSENTIAL_CATEGORY_META.find((c) => c.value === val) ||
        VENDOR_CATEGORY_META.find((c) => c.value === val)
      )
      .filter(Boolean) as CategoryMeta[];
  }, [recentViewed]);

  const handleCategoryClick = (categoryVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategory === categoryVal) {
      params.delete("category");
    } else {
      params.set("category", categoryVal);
    }
    
    router.push(`/directory?${params.toString()}`);
  };

  const filteredEssential = ESSENTIAL_CATEGORY_META.filter((cat) =>
    cat.label.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredVendor = VENDOR_CATEGORY_META.filter((cat) =>
    cat.label.toLowerCase().includes(filterText.toLowerCase())
  );

  const popularCategories = ["PLUMBER", "ELECTRICIAN", "HOSPITAL", "MILK"];

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-[var(--app-sidebar-width)] shrink-0 border-r",
        "border-white/10 bg-[var(--app-sidebar-bg)]",
        "overflow-y-auto scrollbar-thin",
        className
      )}
      style={{ height: "calc(100vh - var(--app-nav-height))" }}
    >
      {/* Category Search Input */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-xl bg-surface-secondary border border-white/10 px-3 py-2 pl-8 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-all"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Recently Viewed */}
      {recentMeta.length > 0 && !filterText && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <History className="h-3 w-3" />
            <span>Recently Viewed</span>
          </div>
          <div className="space-y-0.5">
            {recentMeta.map((cat) => (
              <CategoryChip
                key={`recent-${cat.value}`}
                category={cat}
                isActive={activeCategory === cat.value}
                onClick={() => handleCategoryClick(cat.value)}
              />
            ))}
          </div>
          <div className="mx-3 my-2 border-t border-white/5" />
        </div>
      )}

      <div className="p-4 space-y-1 flex-1">
        {/* Essential Services Section */}
        {filteredEssential.length > 0 && (
          <>
            <button
              onClick={() => setEssentialCollapsed(!essentialCollapsed)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Essential Services</span>
              <span className="text-[9px] bg-surface-tertiary text-text-muted px-1.5 py-0.5 rounded-full font-bold">
                {filteredEssential.length}
              </span>
              <ChevronRight
                className={cn(
                  "ml-auto h-3.5 w-3.5 transition-transform",
                  !essentialCollapsed && "rotate-90"
                )}
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: essentialCollapsed ? 0 : "auto", opacity: essentialCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pb-2">
                {filteredEssential.map((cat) => (
                  <div key={cat.value} className="relative flex items-center group">
                    <CategoryChip
                      category={cat}
                      isActive={activeCategory === cat.value}
                      onClick={() => handleCategoryClick(cat.value)}
                    />
                    {popularCategories.includes(cat.value) && (
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-full font-bold select-none">
                        Popular
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* Divider */}
        {filteredEssential.length > 0 && filteredVendor.length > 0 && (
          <div className="mx-3 my-2 border-t border-white/5" />
        )}

        {/* Local Vendors Section */}
        {filteredVendor.length > 0 && (
          <>
            <button
              onClick={() => setVendorCollapsed(!vendorCollapsed)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Local Vendors</span>
              <span className="text-[9px] bg-surface-tertiary text-text-muted px-1.5 py-0.5 rounded-full font-bold">
                {filteredVendor.length}
              </span>
              <ChevronRight
                className={cn(
                  "ml-auto h-3.5 w-3.5 transition-transform",
                  !vendorCollapsed && "rotate-90"
                )}
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: vendorCollapsed ? 0 : "auto", opacity: vendorCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 pb-2">
                {filteredVendor.map((cat) => (
                  <div key={cat.value} className="relative flex items-center group">
                    <CategoryChip
                      category={cat}
                      isActive={activeCategory === cat.value}
                      onClick={() => handleCategoryClick(cat.value)}
                    />
                    {popularCategories.includes(cat.value) && (
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded-full font-bold select-none">
                        Popular
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {filteredEssential.length === 0 && filteredVendor.length === 0 && (
          <div className="text-center py-8 text-xs text-text-muted">
            No matching categories found.
          </div>
        )}
      </div>
    </aside>
  );
}
