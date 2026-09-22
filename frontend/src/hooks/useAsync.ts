import { useEffect, useState } from "react";
import { ApiError } from "../api/client";

export type AsyncState<T> =
    | { status: "loading" }
    | { status: "ready"; data: T }
    | { status: "failed"; error: ApiError };

// Runs `load` whenever `deps` change, ignoring results from a superseded call
// so a slow first request cannot overwrite a newer one.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
    const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

    useEffect(() => {
        let live = true;
        setState({ status: "loading" });
        load()
            .then((data) => live && setState({ status: "ready", data }))
            .catch((reason) => {
                if (!live) return;
                const error =
                    reason instanceof ApiError
                        ? reason
                        : new ApiError("error", reason?.message ?? "Request failed");
                setState({ status: "failed", error });
            });
        return () => {
            live = false;
        };
    }, deps);

    return state;
}
