import { useState, useEffect, useMemo } from "react";
import { useProfiles, useSearchProfiles } from "@/hooks/use-profiles";
import { ProfileCard } from "@/components/ProfileCard";
import { Map } from "@/components/Map";
import { CreateProfileDialog } from "@/components/CreateProfileDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Map as MapIcon, List, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const {
    data: searchProfiles,
    isLoading,
    error,
  } = useSearchProfiles(activeQuery);
  const { data: allProfiles } = useProfiles();

  const displayedProfiles = useMemo(() => {
    const trimmedQuery = activeQuery.trim();
    if (!trimmedQuery) return allProfiles;
    if ((searchProfiles?.length ?? 0) === 0) return allProfiles;
    return searchProfiles;
  }, [activeQuery, allProfiles, searchProfiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
  };

  // Allow clearing search instantly
  useEffect(() => {
    if (searchInput.trim() === "") {
      setActiveQuery("");
    }
  }, [searchInput]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Hero Section */}
      <header className="relative pt-16 pb-20 px-6 sm:px-8 lg:px-12 bg-white border-b border-border/40 overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Service Discovery</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold font-display tracking-tight text-foreground mb-4">
                Find the perfect <br />
                <span className="text-gradient">HUSTLE.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Describe what you need in plain English. Our semantic search
                will match you with the right skills and services nearby.
              </p>
            </div>

            <div className="flex-shrink-0 md:mb-2">
              <CreateProfileDialog />
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-3xl group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. 'Someone to fix my prom dress' or 'Leaky pipe repair'"
              className="w-full pl-14 pr-32 py-8 text-lg sm:text-xl rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-muted-foreground/10 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all placeholder:text-muted-foreground/60"
            />
            <div className="absolute inset-y-2 right-2 flex items-center">
              <Button
                type="submit"
                size="lg"
                className="rounded-xl px-8 h-full shadow-md font-semibold text-base hover:-translate-y-0.5 transition-transform"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-400px)]">
        {/* Mobile View Toggles */}
        <div className="flex lg:hidden justify-center mb-6 bg-secondary/50 p-1 rounded-xl w-max mx-auto">
          <button
            onClick={() => setMobileView("list")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${mobileView === "list" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${mobileView === "map" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"}`}
          >
            <MapIcon className="w-4 h-4" />
            Map
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Results List View */}
          <div
            className={`col-span-1 lg:col-span-5 xl:col-span-4 flex flex-col h-full ${mobileView === "map" ? "hidden lg:flex" : "flex"}`}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-bold font-display">
                {activeQuery
                  ? `Results for "${activeQuery}"`
                  : "Local Services"}
              </h2>
              <span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                {displayedProfiles?.length || 0} found
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-20 lg:pb-0 space-y-4 custom-scrollbar">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 bg-card rounded-2xl animate-pulse border border-border/50"
                  />
                ))
              ) : error ? (
                <div className="text-center p-8 bg-destructive/5 rounded-2xl border border-destructive/10 text-destructive">
                  Failed to load results. Please try again.
                </div>
              ) : (displayedProfiles?.length ?? 0) === 0 ? (
                <div className="text-center p-12 bg-card rounded-2xl border border-dashed flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No profiles found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or be the first to list a
                    service!
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {displayedProfiles?.map((profile, idx) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      index={idx}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Map View */}
          <div
            className={`col-span-1 lg:col-span-7 xl:col-span-8 h-[600px] lg:h-full rounded-3xl overflow-hidden shadow-sm border border-border/60 relative ${mobileView === "list" ? "hidden lg:block" : "block"}`}
          >
            <Map profiles={displayedProfiles || []} />

            {/* Map Overlay Gradient */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-[400]" />
          </div>
        </div>
      </main>

      {/* Add custom scrollbar styling globally but restrict usage to needed containers */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: hsl(var(--muted-foreground)/0.3);
        }
      `,
        }}
      />
    </div>
  );
}
