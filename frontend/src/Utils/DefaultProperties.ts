
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
    pageSize: number;
    totalCount: number;
    next: number;
    previous: number;
}