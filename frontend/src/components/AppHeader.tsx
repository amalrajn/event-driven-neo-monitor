import { Link } from "react-router-dom";
import { SearchBox } from "./SearchBox";

export function AppHeader({ suggestions }: { suggestions: string[] }) {
    return (
        <header className="app-header">
            <Link className="brand" to="/">
                <span className="brand-mark" aria-hidden="true" />
                Asteroid Tracker
            </Link>
            <SearchBox suggestions={suggestions} />
        </header>
    );
}
