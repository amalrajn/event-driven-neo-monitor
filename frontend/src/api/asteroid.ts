export interface Asteroid {
    spkId: string;
    designation: string;
    fullName: string;
    absoluteMagnitude: number;
    diameterMinM: number;
    diameterMaxM: number;
    isPotentiallyHazardous: boolean;
    isSentryObject: boolean;
    jplUrl: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`);
    const body = await response.json();
    if (!response.ok) {
        throw new Error(body.message ?? "Request failed");
    }
    return body as T;
}

export const getAsteroids = () => request<Asteroid[]>("/asteroids");
export const getAsteroid = (designation: string) =>
    request<Asteroid>(`/asteroids/${encodeURIComponent(designation)}`);
export const getAsteroidHistory = (designation: string) =>
    request<Asteroid[]>(`/asteroids/${encodeURIComponent(designation)}/history`);
