import { LucideIcon } from "lucide-react";

interface QuickAccessCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export const QuickAccessCard = ({ icon: Icon, title, description }: QuickAccessCardProps) => {
  return (
    <button className="bg-[var(--replay-elevated)] p-6 rounded border border-[var(--replay-border)] hover:border-[var(--replay-off-white)] transition-all hover-lift group">
      <div className="bg-[var(--replay-dark-grey)] p-4 rounded group-hover:bg-[var(--replay-border)] transition-colors inline-block">
        <Icon size={28} className="text-[var(--replay-off-white)]" />
      </div>
      <div className="text-left mt-4">
        <h3 className="text-lg font-semibold text-[var(--replay-off-white)]">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--replay-mid-grey)] mt-1">{description}</p>
        )}
      </div>
    </button>
  );
};