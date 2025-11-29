import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToast, ToastType } from "../contexts/ToastContext";

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case "success":
      return {
        bg: "bg-emerald-500/20 border-emerald-500/30",
        icon: <CheckCircle size={18} className="text-emerald-400" />,
        text: "text-emerald-100"
      };
    case "error":
      return {
        bg: "bg-red-500/20 border-red-500/30",
        icon: <AlertCircle size={18} className="text-red-400" />,
        text: "text-red-100"
      };
    case "warning":
      return {
        bg: "bg-amber-500/20 border-amber-500/30",
        icon: <AlertTriangle size={18} className="text-amber-400" />,
        text: "text-amber-100"
      };
    case "info":
    default:
      return {
        bg: "bg-blue-500/20 border-blue-500/30",
        icon: <Info size={18} className="text-blue-400" />,
        text: "text-blue-100"
      };
  }
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 md:bottom-24 left-4 right-4 md:left-auto md:right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);

        return (
          <div
            key={toast.id}
            className={`
              ${styles.bg} ${styles.text}
              backdrop-blur-xl border rounded-xl px-4 py-3
              flex items-center gap-3
              shadow-2xl shadow-black/30
              pointer-events-auto
              animate-slide-up
              max-w-md md:min-w-[320px]
            `}
            style={{
              animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
            }}
          >
            {styles.icon}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/50 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
