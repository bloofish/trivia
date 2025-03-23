"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type LeaderboardEntry = {
  id: number;
  username: string;
  time: number;
};

type LeaderboardProps = {
  refreshTrigger?: boolean;
};

export default function Leaderboard({ refreshTrigger }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("completed_at", today)
        .order("time", { ascending: true }) // Lower time is better.
        .limit(10);
      if (error) {
        console.error("Error fetching leaderboard:", error);
        setError(error.message);
      } else if (data) {
        setLeaderboard(data as LeaderboardEntry[]);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, [refreshTrigger]);

  if (loading)
    return <p className="text-center text-gray-500">Loading leaderboard...</p>;
  if (error)
    return <p className="text-center text-red-500">Error: {error}</p>;
  if (!leaderboard.length)
    return <p className="text-center text-gray-500">No leaderboard entries found.</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Leaderboard</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 border">Rank</th>
            <th className="py-2 border">Username</th>
            <th className="py-2 border">Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={entry.id} className="text-center">
              <td className="py-2 border">{index + 1}</td>
              <td className="py-2 border">{entry.username}</td>
              <td className="py-2 border">{entry.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
