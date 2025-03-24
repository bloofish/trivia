"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";
import leoProfanity from "leo-profanity";

leoProfanity.loadDictionary();

type LeaderboardEntryProps = {
  time: number; // the time taken (lower is better)
  onScoreSubmitted: () => void; // callback to trigger leaderboard refresh
};

export default function LeaderboardEntry({ time, onScoreSubmitted }: LeaderboardEntryProps) {
  const [userName, setUserName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [hasScore, setHasScore] = useState<boolean>(false);
  const [qualifies, setQualifies] = useState<boolean>(false);

  // Create a Supabase client instance.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Get or create a cookie-based user ID.
    let id = Cookies.get("user_id");
    if (!id) {
      id = uuidv4();
      Cookies.set("user_id", id, { expires: 365 });
    }
    setUserId(id);

    const checkScoreAndQualification = async () => {
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

      // Check if the user already has a leaderboard entry for today.
      const { data: userData, error: userError } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("user_id", id)
        .eq("completed_at", today);
      if (userError) {
        console.error("Error fetching leaderboard for user:", userError.message);
        setError("Error fetching leaderboard information.");
      }
      if (userData && userData.length > 0) {
        setHasScore(true);
      }

      // Check if the user's time qualifies for the top 10 today.
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("completed_at", today)
        .order("time", { ascending: true }) // lower time is better
        .limit(10);
      if (leaderboardError) {
        console.error("Error fetching leaderboard for qualification:", leaderboardError.message);
        setError("Error checking leaderboard qualification.");
        return;
      }
      if (leaderboardData) {
        if (leaderboardData.length < 10) {
          setQualifies(true);
        } else {
          const tenthEntry = leaderboardData[leaderboardData.length - 1];
          setQualifies(time < tenthEntry.time);
        }
      }
    };

    checkScoreAndQualification();
  }, [supabase, time]);

  // Helper function to check if the name is valid.
  const isValidName = (name: string): boolean => {
    return !leoProfanity.check(name) && name.trim().length > 0;
  };

  // Clean the name (replaces profane words with asterisks).
  const sanitizeName = (name: string): string => {
    return leoProfanity.clean(name);
  };

  const handleSubmit = async () => {
    if (!isValidName(userName)) {
      setError("Invalid name. Please choose a different name.");
      return;
    }
    if (hasScore) {
      setError("You have already submitted a score.");
      return;
    }
    if (!qualifies) {
      setError("Your time does not qualify for the leaderboard.");
      return;
    }
    if (!userId) {
      setError("User ID is not available.");
      return;
    }
    const sanitized = sanitizeName(userName);
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    // Use upsert to ensure one entry per user per day.
    const { error } = await supabase
      .from("leaderboard")
      .upsert([{ user_id: userId, username: sanitized, time, completed_at: today }], { onConflict: "user_id,completed_at" });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Score uploaded successfully!");
      setUserName("");
      setHasScore(true);
      onScoreSubmitted(); // Trigger leaderboard refresh in parent.
    }
  };

  // Only show the entry form if the user doesn't already have a score and their time qualifies.
  if (hasScore || !qualifies) {
    return null;
  }

  return (
    <div className="mt-4">
      <input
        type="text"
        placeholder="Enter your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white py-2 px-4 rounded ml-2"
      >
        Submit Score
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </div>
  );
}