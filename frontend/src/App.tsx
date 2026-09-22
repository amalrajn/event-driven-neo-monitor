import { BrowserRouter, Route, Routes } from "react-router-dom";
import { getAsteroids } from "./api/asteroids";
import { useAsync } from "./hooks/useAsync";
import { AppHeader } from "./components/AppHeader";
import { AwaitingApi } from "./components/AwaitingApi";
import { Dashboard } from "./pages/Dashboard";
import { AsteroidDetail } from "./pages/AsteroidDetail";
import "./styles.css";

export default function App() {
    const asteroids = useAsync(getAsteroids, []);
    const list = asteroids.status === "ready" ? asteroids.data : [];

    return (
        <BrowserRouter>
            <AppHeader suggestions={list.map((a) => a.designation)} />
            <main className="page">
                {asteroids.status === "failed" && asteroids.error.kind === "offline" ? (
                    <AwaitingApi
                        error={asteroids.error}
                        what="Start the backend with `npm run dev` in ./backend, then reload."
                        height={220}
                    />
                ) : (
                    <Routes>
                        <Route path="/" element={<Dashboard asteroids={list} />} />
                        <Route path="/asteroids/:designation" element={<AsteroidDetail />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                )}
            </main>
        </BrowserRouter>
    );
}

function NotFound() {
    return (
        <div className="awaiting awaiting-empty">
            <span className="awaiting-mark" aria-hidden="true">∅</span>
            <p className="awaiting-head">Page not found</p>
            <p className="awaiting-body">That route does not exist.</p>
        </div>
    );
}
