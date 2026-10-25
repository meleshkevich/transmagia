"use client";

import { useState } from "react";

import { CreateUserForm } from "@/components/admin/create-user-form";
import { UsersListAccordion } from "@/components/admin/users-list-accordion";
import { AccordionSection } from "@/components/ui/accordion-section";

interface AdminUsersAccordionsProps {
    currentUserId: string;
}

export function AdminUsersAccordions({ currentUserId }: AdminUsersAccordionsProps) {
    const [listVersion, setListVersion] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);

    function invalidateList() {
        setListVersion((v) => v + 1);
    }

    return (
        <div>
            <AccordionSection
                title="Создать пользователя"
                open={createOpen}
                onOpenChange={setCreateOpen}
            >
                <CreateUserForm onSuccess={invalidateList} />
            </AccordionSection>

            <UsersListAccordion
                currentUserId={currentUserId}
                version={listVersion}
                onUserAction={invalidateList}
            />
        </div>
    );
}
