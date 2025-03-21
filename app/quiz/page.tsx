"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QuestionCard from "../../components/QuestionCard";
import Leaderboard from "../../components/Leaderboard";
import LeaderboardEntry from "../../components/LeaderboardEntry";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple helper to shuffle an array.
function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export default function QuizPage() {
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wrongAnimation, setWrongAnimation] = useState(false);

  // Fetch questions from Supabase on mount.
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data, error } = await supabase.from("questions").select("*");
      if (error) {
        console.error("Error fetching questions:", error.message, error.details);
      } else if (data && data.length > 0) {
        // If more than 10 questions exist, pick 10 randomly.
        const questions =
          data.length >= 10 ? shuffleArray([...data]).slice(0, 10) : data;
        setQuizQuestions(questions);
        setCurrentIndex(0);
        setStartTime(Date.now());
      } else {
        console.error("No questions available.");
      }
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  // Called when an answer is selected.
  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = quizQuestions[currentIndex];
    if (answer === currentQuestion.correct_answer) {
      // Correct answer: move to next question.
      if (currentIndex + 1 === quizQuestions.length) {
        // Last question answered correctly.
        setEndTime(Date.now());
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } else {
      // Wrong answer: flash progress bar red and reset quiz.
      setWrongAnimation(true);
      setTimeout(() => setWrongAnimation(false), 1000);
      const reshuffled = shuffleArray([...quizQuestions]);
      setQuizQuestions(reshuffled);
      setCurrentIndex(0);
      setStartTime(Date.now());
      setEndTime(null);
    }
  };

  // End screen showing final stats along with leaderboard components.
  if (!loading && endTime !== null && currentIndex >= quizQuestions.length) {
    const timeTaken =
      endTime && startTime ? ((endTime - startTime) / 1000).toFixed(2) : "0";
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Complete!</h1>
          <p className="mb-4">Time Taken: {timeTaken} seconds</p>
            <LeaderboardEntry score={parseFloat(timeTaken)} />
          {/* Leaderboard display */}
          <Leaderboard />
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition mt-4"
            onClick={() => window.location.reload()}
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return <p className="text-center text-gray-500">Loading questions...</p>;
  if (!quizQuestions.length)
    return <p className="text-center text-red-500">No questions available.</p>;

  // Calculate progress based on the number of correct answers.
  const progress = (currentIndex / quizQuestions.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Progress Bar */}
      <div className="w-full max-w-xl mb-4">
        <div
          className={`w-full h-4 rounded-full overflow-hidden ${
            wrongAnimation ? "animate-pulse bg-red-500" : "bg-gray-300"
          }`}
        >
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      {/* Quiz Container */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl">
        <QuestionCard
          question={quizQuestions[currentIndex]}
          onSelectAnswer={handleAnswerSelect}
        />
      </div>
    </div>
  );
}
