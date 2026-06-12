"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type LabApp = {
  id: string;
  app_key: string;
  app_name: string;
  category: string | null;
  status: string;
  priority: number | null;
  target_market: string | null;
  description: string | null;
  route_path: string | null;
  icon_emoji: string | null;
  is_active: boolean;
};

export default function LabDashboardPage() {
  const [apps, setApps] = useState<LabApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadApps() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("lab_apps")
      .select(
        "id, app_key, app_name, category, status, priority, target_market, description, route_path, icon_emoji, is_active"
      )
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .order("app_name", { ascending: true });

    if (error) {
      setMessage(`Failed to load Lab Apps: ${error.message}`);
      setApps([]);
      setLoading(false);
      return;
    }

    setApps((data || []) as LabApp[]);
    setLoading(false);
  }

  useEffect(() => {
    loadApps();
  }, []);

  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{ color: "#666", marginBottom: "8px" }}>Let&apos;s Do..!</p>

        <h1 style={{ fontSize: "36px", margin: "0 0 12px" }}>
          LetsDo Lab
        </h1>

        <p style={{ color: "#555", maxWidth: "760px", lineHeight: 1.6 }}>
          Internal incubator for LetsDo digital tools. Use this space to test,
          organize, and develop MVPs before moving selected products into their
          own production project.
        </p>

        <div
          style={{
            marginTop: "20px",
            padding: "14px 16px",
            border: "1px solid #eee",
            borderRadius: "12px",
            background: "#fafafa",
            color: "#555",
          }}
        >
          <strong>Database source:</strong> Supabase table{" "}
          <code>lab_apps</code>
        </div>

        {loading && (
          <p style={{ marginTop: "28px", color: "#777" }}>
            Loading LetsDo Lab apps...
          </p>
        )}

        {message && (
          <div
            style={{
              marginTop: "24px",
              padding: "14px 16px",
              border: "1px solid #f0b5b5",
              borderRadius: "12px",
              background: "#fff5f5",
              color: "#9b1c1c",
            }}
          >
            {message}
          </div>
        )}

        {!loading && !message && apps.length === 0 && (
          <p style={{ marginTop: "28px", color: "#777" }}>
            No active lab apps found.
          </p>
        )}

        {!loading && !message && apps.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              marginTop: "28px",
            }}
          >
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.route_path || `/lab/${app.app_key}`}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #ddd",
                  borderRadius: "16px",
                  padding: "20px",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    {app.icon_emoji ? `${app.icon_emoji} ` : ""}
                    {app.app_name}
                  </strong>

                  <span
                    style={{
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "999px",
                      background: "#f2f2f2",
                    }}
                  >
                    {app.status}
                  </span>
                </div>

                <p
                  style={{
                    margin: "0 0 10px",
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  {app.category || "Uncategorized"}
                </p>

                <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
                  {app.description || "No description yet."}
                </p>

                {app.target_market && (
                  <p
                    style={{
                      margin: "14px 0 0",
                      color: "#777",
                      fontSize: "13px",
                    }}
                  >
                    Target: {app.target_market}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}