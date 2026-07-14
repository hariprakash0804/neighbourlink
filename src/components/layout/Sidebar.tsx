"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ESSENTIAL_CATEGORY_META, VENDOR_CATEGORY_META, type CategoryMeta } from "@/lib/constants";
import { ChevronRight, Building2, Wrench } from "lucide-react";

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

  const handleCategoryClick = (categoryVal: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategory === categoryVal) {
      params.delete("category");
    } else {
      params.set("category", categoryVal);
    }
    
    // Redirect to /directory if not already there, else just push query params
    const targetPath = pathname === "/directory" ? "/directory" : "/directory";
    router.push(`${targetPath}?${params.toString()}`);
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-[var(--app-sidebar-width)] shrink-0 border-r",
        "border-white/10 bg-[var(--app-sidebar-bg)]",
        "overflow-y-auto scrollbar-thin",
        className
      )}
      style={{ height: "calc(100vh - var(--app-nav-height) - 28px)" }}
    >
      <div className="p-4 space-y-1">
        {/* Essential Services Section */}
        <button
          onClick={() => setEssentialCollapsed(!essentialCollapsed)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Essential Services</span>
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
            {ESSENTIAL_CATEGORY_META.map((cat) => (
              <CategoryChip
                key={cat.value}
                category={cat}
                isActive={activeCategory === cat.value}
                onClick={() => handleCategoryClick(cat.value)}
              />
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="mx-3 border-t border-white/5 dark:border-white/5" />

        {/* Local Vendors Section */}
        <button
          onClick={() => setVendorCollapsed(!vendorCollapsed)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Local Vendors</span>
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
            {VENDOR_CATEGORY_META.map((cat) => (
              <CategoryChip
                key={cat.value}
                category={cat}
                isActive={activeCategory === cat.value}
                onClick={() => handleCategoryClick(cat.value)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </aside>
  );
}
