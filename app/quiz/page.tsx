"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QuestionCard from "../../components/QuestionCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QuizPage() {
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestion() {
      setLoading(true);
      const { data, error } = await supabase
        .from("questions")
        .select("*");

      if (error) {
        console.error("Error fetching question:", error.message, error.details);
      } else if (data && data.length > 0) {
        // Randomly select one question from the fetched data
        const randomQuestion = data[Math.floor(Math.random() * data.length)];
        setQuestion(randomQuestion);
      } else {
        console.error("No questions available.");
      }
      setLoading(false);
    }

    fetchQuestion();
  }, []);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === question.correct_answer) {
      setFeedback("✅ Correct!");
    } else {
      setFeedback("❌ Incorrect!");
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading question...</p>;
  if (!question) return <p className="text-center text-red-500">No questions available.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl">
        <h1 className="text-xl font-bold mb-4">Trivia Question</h1>
        <QuestionCard question={question} onSelectAnswer={handleAnswerSelect} />
        {selectedAnswer && <p className="mt-4 text-lg font-semibold">{feedback}</p>}
      </div>
    </div>
  );
}
