import { getVersionString } from "@shared/version";

interface VersionDisplayProps {
  className?: string;
}

export default function VersionDisplay({ className = "" }: VersionDisplayProps) {
  return (
    <div className={`fixed bottom-2 right-2 z-10 ${className}`}>
      <span className="text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
        v{getVersionString()}
      </span>
    </div>
  );
}