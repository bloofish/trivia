"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";
import leoProfanity from "leo-profanity";

leoProfanity.loadDictionary();

type LeaderboardEntryProps = {
  score: number; // the score to upload (e.g., time taken in seconds)
};

export default function LeaderboardEntry({ score }: LeaderboardEntryProps) {
  const [userName, setUserName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [hasScore, setHasScore] = useState<boolean>(false);

  // Create a Supabase client instance.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // On mount, try to get or set the user ID from/in a cookie.
  useEffect(() => {
    let id = Cookies.get("user_id");
    if (!id) {
      id = uuidv4();
      Cookies.set("user_id", id, { expires: 365 }); // store for 1 year
    }
    setUserId(id);

    // Check if the user already has a score.
    const checkScore = async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("user_id", id);
      if (error) {
        console.error("Error fetching leaderboard:", error.message);
        setError("Error fetching leaderboard information.");
        return;
      }
      if (data && data.length > 0) {
        setHasScore(true);
      }
    };
    checkScore();
  }, [supabase]);

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
    if (!userId) {
      setError("User ID is not available.");
      return;
    }
    const sanitized = sanitizeName(userName);
    // Use upsert to ensure one score per user (make sure leaderboard table has a unique constraint on user_id).
    const { data, error } = await supabase
      .from("leaderboard")
      .upsert([{ user_id: userId, username: sanitized, score }], { onConflict: "user_id" });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Score uploaded successfully!");
      setUserName("");
      setHasScore(true);
    }
  };

  return (
    <div className="mt-4">
      <input
        type="text"
        placeholder="Enter your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="border p-2 rounded"
        disabled={hasScore}
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white py-2 px-4 rounded ml-2"
        disabled={hasScore}
      >
        Submit Score
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </div>
  );
}
