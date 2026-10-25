import { LoaderCircle } from "lucide-react";

interface PageLoadingSpinnerProps {
    className?: string;
    size?: number;
}

export function PageLoadingSpinner({ className, size = 32 }: PageLoadingSpinnerProps) {
    return (
        <div
            className={`flex items-center justify-center p-8${className ? ` ${className}` : ""}`}
            role="status"
            aria-label="Загрузка..."
        >
            <LoaderCircle
                size={size}
                className="animate-spin motion-reduce:animate-none text-primary"
                aria-hidden="true"
            />
            <span className="sr-only">Загрузка...</span>
        </div>
    );
}
