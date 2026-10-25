"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible } from "radix-ui";

interface AccordionSectionProps {
    title: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function AccordionSection({ title, open, onOpenChange, children }: AccordionSectionProps) {
    return (
        <Collapsible.Root open={open} onOpenChange={onOpenChange} className="admin-accordion">
            <Collapsible.Trigger className="admin-accordion-trigger">
                <span>{title}</span>
                <ChevronDown
                    size={18}
                    className={`admin-accordion-chevron${open ? " admin-accordion-chevron-open" : ""}`}
                    aria-hidden="true"
                />
            </Collapsible.Trigger>
            <Collapsible.Content className="admin-accordion-content">
                {children}
            </Collapsible.Content>
        </Collapsible.Root>
    );
}
