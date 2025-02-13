
export type defaultProperties = {
    addedAt: string;
    addedBy: number;
    updatedAt: string;
    lastUpdatedBy: number;
    deletedAt: string | null;
}

export type pagination = {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    next: number;
    previous: number;
}