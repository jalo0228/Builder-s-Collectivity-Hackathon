import { type Profile } from "@shared/schema";
import { MapPin, Briefcase, UserRound } from "lucide-react";
import { motion } from "framer-motion";

export function ProfileCard({ profile, index = 0 }: { profile: Profile; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className="group relative bg-card p-6 rounded-2xl shadow-sm border border-border/60 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
    >
      <div className="absolute top-6 right-6 w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <UserRound className="w-6 h-6" />
      </div>

      <div className="pr-16">
        <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
          {profile.name}
        </h3>
        
        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-md text-foreground/80">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{profile.serviceType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{profile.location}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border/40 pt-4">
        <p className="text-muted-foreground leading-relaxed line-clamp-3">
          {profile.description}
        </p>
      </div>
    </motion.div>
  );
}
