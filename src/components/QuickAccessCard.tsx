import { LucideIcon } from "lucide-react";

interface QuickAccessCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export const QuickAccessCard = ({ icon: Icon, title, description }: QuickAccessCardProps) => {
  return (
    <div className="w-full bg-[var(--replay-elevated)] p-5 md:p-6 rounded-xl border border-[var(--replay-border)] hover:border-[var(--replay-off-white)] transition-all hover-lift group flex flex-col items-center text-center">
      <div className="bg-[var(--replay-dark-grey)] p-3 md:p-4 rounded-lg group-hover:bg-[var(--replay-border)] transition-colors">
        <Icon size={24} className="text-[var(--replay-off-white)] md:w-7 md:h-7" />
      </div>
      <div className="mt-3 md:mt-4">
        <h3 className="text-base md:text-lg font-semibold text-[var(--replay-off-white)]">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--replay-mid-grey)] mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};