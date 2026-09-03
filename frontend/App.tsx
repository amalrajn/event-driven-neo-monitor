import { FormEvent, useEffect, useState } from "react";
import {
    Asteroid,
    getAsteroid,
    getAsteroidHistory,
    getAsteroids,
} from "./src/api/asteroid";
import "./src/styles.css";

function App() {
    const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
    const [selected, setSelected] = useState<Asteroid | null>(null);
    const [history, setHistory] = useState<Asteroid[]>([]);
    const [designation, setDesignation] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getAsteroids()
            .then(setAsteroids)
            .catch((reason: Error) => setError(reason.message))
            .finally(() => setLoading(false));
    }, []);

    async function search(event: FormEvent) {
        event.preventDefault();
        if (!designation.trim()) return;
        setError("");
        try {
            const asteroid = await getAsteroid(designation.trim());
            setSelected(asteroid);
            setHistory(await getAsteroidHistory(designation.trim()));
        } catch (reason) {
            setSelected(null);
            setHistory([]);
            setError(reason instanceof Error ? reason.message : "Request failed");
        }
    }

    return (
        <main className="page">
            <header>
                <p className="eyebrow">ASTEROID TRACKER</p>
                <h1>Explore nearby asteroids</h1>
                <p className="subtitle">Browse saved asteroids or search by designation.</p>
            </header>

            <form className="search" onSubmit={search}>
                <input
                    value={designation}
                    onChange={(event) => setDesignation(event.target.value)}
                    placeholder="Designation, e.g. 433"
                    aria-label="Asteroid designation"
                />
                <button type="submit">Search</button>
            </form>

            {error && <p className="error">{error}</p>}

            {selected && (
                <section className="detail card">
                    <div>
                        <p className="eyebrow">SELECTED ASTEROID</p>
                        <h2>{selected.fullName}</h2>
                        <p>{selected.designation} · SPK ID {selected.spkId}</p>
                    </div>
                    <div className="stats">
                        <span><strong>{selected.diameterMinM}–{selected.diameterMaxM} m</strong> diameter</span>
                        <span><strong>{selected.absoluteMagnitude}</strong> magnitude</span>
                        <span><strong>{history.length}</strong> history records</span>
                    </div>
                    <a href={selected.jplUrl} target="_blank" rel="noreferrer">View JPL details →</a>
                </section>
            )}

            <section>
                <div className="section-heading">
                    <h2>Asteroids</h2>
                    <span>{asteroids.length} total</span>
                </div>
                {loading ? <p>Loading asteroids…</p> : (
                    <div className="grid">
                        {asteroids.map((asteroid) => (
                            <button className="card asteroid" key={asteroid.spkId} onClick={() => setDesignation(asteroid.designation)}>
                                <div className="planet" />
                                <div>
                                    <h3>{asteroid.fullName}</h3>
                                    <p>{asteroid.designation}</p>
                                    {asteroid.isPotentiallyHazardous && <span className="warning">Potentially hazardous</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default App;
