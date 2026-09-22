import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export function SearchBox({ suggestions }: { suggestions: string[] }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const boxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const matches = query.trim()
        ? suggestions.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
        : [];

    function go(designation: string) {
        if (!designation.trim()) return;
        setOpen(false);
        setQuery("");
        navigate(`/asteroids/${encodeURIComponent(designation.trim())}`);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        go(matches[0] ?? query);
    }

    return (
        <div className="search" ref={boxRef}>
            <form onSubmit={submit} role="search">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search designation…"
                    aria-label="Search asteroids by designation"
                    autoComplete="off"
                />
            </form>
            {open && matches.length > 0 && (
                <ul className="search-results">
                    {matches.map((designation) => (
                        <li key={designation}>
                            <button type="button" onClick={() => go(designation)}>{designation}</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
