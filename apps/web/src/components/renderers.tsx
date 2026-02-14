import type { UseQueryResult } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import type { ReactNode } from "react";

type QueryRendererProps<T> = {
    query: UseQueryResult<T, Error>;
    loadingState?: ReactNode;
    errorState?: ReactNode;
    render: (data: T) => ReactNode;
}

export function QueryRenderer<T>({ query, loadingState, errorState, render }: QueryRendererProps<T>) {
    if (query.isLoading) {
        return loadingState || <Loader />;
    }

    if (query.isError) {

        return errorState || null;
    }

    return render(query.data as T);
}
