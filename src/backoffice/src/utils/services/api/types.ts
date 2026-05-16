export interface pageableProps {
    sort?: string;
    page?: number | null | undefined
    size?: number;
    filterExp?: string;
}

interface Sort {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
}

interface Pageable {
    sort: Sort;
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
}

export interface pageableResponseI {
    content: any;
    pageable: Pageable;
    totalPages: number;
    totalElements: number;
    last: boolean;
    first: boolean;
    sort: Sort;
    number: number;
    numberOfElements: number;
    size: number;
    empty: boolean;
}
