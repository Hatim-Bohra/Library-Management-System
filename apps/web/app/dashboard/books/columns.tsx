"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Book } from "@/lib/books"

export const columns: ColumnDef<Book>[] = [
    {
        accessorKey: "title",
        header: "Title",
    },
    {
        accessorKey: "isbn",
        header: "ISBN",
    },
    {
        accessorKey: "publishedYear",
        header: "Year",
    },
    {
        accessorKey: "copies",
        header: "Copies",
    },
]
