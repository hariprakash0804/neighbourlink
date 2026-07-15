"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, ShieldAlert, Phone, MapPin, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AuthModal } from "../auth/AuthModal";

export function SosButton() {
  const { data: session } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  const [alertResult, setAlertResult] = useState<any>(null);
  
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const triggerSos = trpc.sos.trigger.useMutation();

  const handleStartHold = () => {
    if (!session?.user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / 1500) * 100); // 1.5s hold time
      setHoldProgress(progress);

      if (progress >= 100) {
        handleTriggerSos();
      }
    }, 30);
  };

  const handleEndHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
  };

  const handleTriggerSos = () => {
    handleEndHold();
    
    // Obtain geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await executeSos(position.coords.latitude, position.coords.longitude);
        },
        async (error) => {
          console.warn("Geolocation failed, using default coordinates:", error);
          // Fallback to default address coordinates if available, or default Bangalore coordinates
          await executeSos(12.9716, 77.5946);
        }
      );
    } else {
      executeSos(12.9716, 77.5946);
    }
  };

  const executeSos = async (lat: number, lng: number) => {
    try {
      setIsTriggered(true);
      const res = await triggerSos.mutateAsync({
        lat,
        lng,
        message: "🚨 EMERGENCY SOS triggered by resident from NeighborLink! Send help immediately.",
        emergencyContacts: ["112", "100", "102"], // National, Police, Ambulance
      });
      setAlertResult(res);
    } catch (err) {
      console.error("SOS trigger failed:", err);
    }
  };

  useEffect(() => {
    const handleTriggerEvent = () => {
      if (!session?.user) {
        setIsAuthModalOpen(true);
      } else {
        handleTriggerSos();
      }
    };
    window.addEventListener("trigger-sos", handleTriggerEvent);
    return () => {
      window.removeEventListener("trigger-sos", handleTriggerEvent);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [session]);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 select-none hidden lg:block">
        {/* Pulsing Back Ring */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-red-600 pointer-events-none"
            animate={{
              scale: isHolding ? [1, 1.4, 1] : [1, 1.25, 1],
              opacity: isHolding ? [0.4, 0, 0.4] : [0.2, 0, 0.2],
            }}
            transition={{
              duration: isHolding ? 0.8 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Main Hold Button */}
          <button
            onMouseDown={handleStartHold}
            onMouseUp={handleEndHold}
            onMouseLeave={handleEndHold}
            onTouchStart={handleStartHold}
            onTouchEnd={handleEndHold}
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all focus:outline-none",
              isHolding && "scale-95 brightness-90"
            )}
          >
            <AlertOctagon className="h-6 w-6" />
            <span className="sr-only">SOS</span>

            {/* Circular Progress Overlay */}
            {isHolding && (
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="white"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={163}
                  strokeDashoffset={163 - (163 * holdProgress) / 100}
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* SOS Trigger Overlay Modal */}
      <AnimatePresence>
        {isTriggered && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-card p-6 border border-red-500/30 max-w-sm w-full text-center space-y-5"
            >
              <div className="rounded-full bg-red-500/20 p-4 border border-red-500/30 text-red-500 w-fit mx-auto animate-pulse">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black tracking-tight text-white uppercase">SOS Alert Dispatched</h2>
                <p className="text-xs text-red-200">
                  Emergency services and saved contacts have been alerted with your live location.
                </p>
              </div>

              {triggerSos.isPending ? (
                <div className="flex items-center justify-center py-4">
                  <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : (
                alertResult && (
                  <div className="space-y-4">
                    <div className="p-3 bg-red-900/30 border border-red-500/20 rounded-xl space-y-1.5 text-left text-xs">
                      <p className="text-red-200 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-red-400" />
                        <span>Live Location Dispatched:</span>
                      </p>
                      <a
                        href={alertResult.locationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 font-mono text-[10px] underline hover:text-red-300 block truncate"
                      >
                        {alertResult.locationLink}
                      </a>
                      <p className="text-red-200 flex items-center gap-1.5 pt-1.5 border-t border-red-500/10">
                        <Phone className="h-4 w-4 shrink-0 text-red-400" />
                        <span>Notified Contacts:</span>
                      </p>
                      <p className="text-red-100 font-semibold">
                        {alertResult.contactsNotified.join(", ")}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsTriggered(false);
                        setAlertResult(null);
                      }}
                      className="w-full flex items-center justify-center gap-1 rounded-xl bg-white text-red-950 hover:bg-red-50 py-2.5 text-xs font-bold transition-all shadow-md"
                    >
                      <X className="h-4 w-4" />
                      Close & Dismiss Alert
                    </button>
                  </div>
                )
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
