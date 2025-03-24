"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QuestionCard from "../../components/QuestionCard";
import Leaderboard from "../../components/Leaderboard";
import LeaderboardEntry from "../../components/LeaderboardEntry";
import Cookies from "js-cookie"; // Import js-cookie

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple helper to shuffle an array.
function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

export default function QuizPage() {
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wrongAnimation, setWrongAnimation] = useState(false);
  const [refreshLeaderboard, setRefreshLeaderboard] = useState<boolean>(false);

  // Fetch questions from Supabase on mount.
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      // Get today's date as "YYYY-MM-DD"
      const today = new Date().toISOString().split("T")[0];

      // Check if the user has already completed the quiz today
      const quizCompleted = Cookies.get("quizCompleted");
      if (quizCompleted) {
        const [completedDate, timeTaken] = quizCompleted.split("|");
        if (completedDate === today) {
          setLoading(false);
          setEndTime(Date.now());
          setStartTime(Date.now() - parseFloat(timeTaken) * 1000);
          return;
        }
      }

      // Query only questions for today's date.
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("date", today);
      if (error) {
        console.error("Error fetching questions:", error.message, error.details);
      } else if (data && data.length > 0) {
        // Shuffle and limit to 10 questions (if there are more than 10)
        const questions =
          data.length > 10 ? shuffleArray([...data]).slice(0, 10) : shuffleArray([...data]);
        setQuizQuestions(questions);
        setCurrentIndex(0);
        setStartTime(Date.now());
      } else {
        console.error("No questions available for today.");
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
        // Set cookie to mark quiz as completed for today with time taken
        const today = new Date().toISOString().split("T")[0];
        const timeTaken = ((Date.now() - startTime!) / 1000).toFixed(2);
        Cookies.set("quizCompleted", `${today}|${timeTaken}`, { expires: 1 });
      } else {
        const nextIndex = currentIndex + 1;
        const shuffledAnswers = shuffleArray([...quizQuestions[nextIndex].answers]);
        quizQuestions[nextIndex].answers = shuffledAnswers;
        setCurrentIndex(nextIndex);
      }
    } else {
      // Wrong answer: flash progress bar red and reset quiz.
      setWrongAnimation(true);
      setTimeout(() => setWrongAnimation(false), 1000);
      const reshuffled = shuffleArray([...quizQuestions]);
      setQuizQuestions(reshuffled);
      const nextIndex = 0;
      const shuffledAnswers = shuffleArray([...quizQuestions[nextIndex].answers]);
      quizQuestions[nextIndex].answers = shuffledAnswers;
      setCurrentIndex(nextIndex);;
      setStartTime(Date.now());
      setEndTime(null);
    }
  };

  // End screen showing final stats along with leaderboard components.
  const finalTime = endTime && startTime ? parseFloat(((endTime - startTime) / 1000).toFixed(2)) : 0;

  if (!loading && endTime !== null && currentIndex >= quizQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Complete!</h1>
          <p className="mb-4">Time Taken: {finalTime} seconds</p>
          {/* Show LeaderboardEntry only if the user hasn't submitted a username and qualifies */}
          <LeaderboardEntry
            time={finalTime}
            onScoreSubmitted={() => setRefreshLeaderboard(prev => !prev)}
          />
          <Leaderboard refreshTrigger={refreshLeaderboard} />
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
      <h1 className="text-4xl font-heading mb-8">Trivia!</h1>
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
