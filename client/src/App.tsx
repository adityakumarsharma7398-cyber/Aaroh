import React, { useEffect, useState } from "react";
import type { Student, DevelopmentSignal } from "@education-growth/shared";

interface HealthResponse {
  status: string;
  timestamp: string;
  database: {
    ok: boolean;
    dialect: string;
    path: string;
  };
  sampleContractCheck: Student;
}

export default function App(): React.JSX.Element {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Type check test for shared signals interface
  const signalContractTest: DevelopmentSignal = {
    id: "sig-test-1",
    studentId: "student-1",
    signalName: "Self-Correction Frequency",
    indicator: "growth",
    value: 0.85,
    description: "Successfully demonstrated contract type safety across client and shared workspace.",
    generatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then((data: HealthResponse) => setHealth(data))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Education Growth Engine Foundation</h1>
      <p>Baseline setup verification (Hackathon Foundation):</p>
      
      <section style={{ background: "#f4f4f5", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
        <h3>Server & SQLite Status</h3>
        {error && <p style={{ color: "red" }}>Backend connection pending or error: {error}</p>}
        {health ? (
          <div>
            <p><strong>Status:</strong> {health.status}</p>
            <p><strong>SQLite Connection:</strong> {health.database.ok ? "Connected (WAL mode)" : "Disconnected"}</p>
            <p><strong>Database Path:</strong> {health.database.path}</p>
          </div>
        ) : (
          !error && <p>Connecting to backend API...</p>
        )}
      </section>

      <section style={{ background: "#f4f4f5", padding: "1rem", borderRadius: "8px" }}>
        <h3>Shared Contract Types Link</h3>
        <p><strong>Contract Indicator:</strong> {signalContractTest.indicator}</p>
        <p><strong>Description:</strong> {signalContractTest.description}</p>
      </section>
    </main>
  );
}
