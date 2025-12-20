"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Member } from "@/lib/members"

export const columns: ColumnDef<Member>[] = [
    {
        accessorKey: "firstName",
        header: "First Name",
    },
    {
        accessorKey: "lastName",
        header: "Last Name",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "role",
        header: "Role",
    },
]
