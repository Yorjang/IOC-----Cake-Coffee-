import { CakeSlice, Loader2 } from "lucide-react";

interface LoadingScreenProps {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
        <div className="relative flex items-center justify-center">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          
          {/* Main Logo Circle */}
          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl">
            <CakeSlice size={40} className="animate-pulse" />
          </div>
        </div>
        
        <h2 className="mt-6 font-serif text-2xl font-bold text-foreground">Sweet Bean</h2>
        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm font-medium">Đang tải...</span>
        </div>
      </div>
    </div>
  );
}
