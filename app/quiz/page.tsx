"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QuestionCard from "../../components/QuestionCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QuizPage() {
  // Pools and state for questions
  const [remainingQuestions, setRemainingQuestions] = useState<any[]>([]);
  const [correctQuestions, setCorrectQuestions] = useState<any[]>([]);
  const [redoQueue, setRedoQueue] = useState<any[]>([]);
  const [isRedoMode, setIsRedoMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  // Other UI state
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [newQuestionFlash, setNewQuestionFlash] = useState(false);
  const [wrongAnimation, setWrongAnimation] = useState(false);
  const [lastWrongAnswer, setLastWrongAnswer] = useState<string | null>(null);

  // Helper: pick a random question from an array.
  const getRandomQuestion = (questionsArray: any[]) => {
    return questionsArray[Math.floor(Math.random() * questionsArray.length)];
  };

  // Helper: load a new question with a yellow flash to indicate "NEW!"
  const loadNewQuestion = (newQ: any) => {
    setCurrentQuestion(newQ);
  };

  // Fetch all questions once on mount.
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data, error } = await supabase.from("questions").select("*");
      if (error) {
        console.error("Error fetching questions:", error.message, error.details);
      } else if (data && data.length > 0) {
        setRemainingQuestions(data);
        loadNewQuestion(getRandomQuestion(data));
      } else {
        console.error("No questions available.");
      }
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    // Correct answer handling:
    if (answer === currentQuestion.correct_answer) {
      setStreak(prev => prev + 1);
      // In normal mode:
      if (!isRedoMode) {
        setNewQuestionFlash(true);
        // Remove the flash effect after 1 second.
        setTimeout(() => setNewQuestionFlash(false), 1000);
        
        setCorrectQuestions(prev => [...prev, currentQuestion]);
        const updatedRemaining = remainingQuestions.filter(q => q.id !== currentQuestion.id);
        setRemainingQuestions(updatedRemaining);
        if (updatedRemaining.length > 0) {
          loadNewQuestion(getRandomQuestion(updatedRemaining));
        } else {
          setCurrentQuestion(null);
        }
      } else {
        // In redo mode, remove current question from the redo queue.
        const updatedRedo = redoQueue.filter(q => q.id !== currentQuestion.id);
        setRedoQueue(updatedRedo);
        if (updatedRedo.length > 0) {
          loadNewQuestion(getRandomQuestion(updatedRedo));
        } else {
          // Exit redo mode and continue with remaining questions.
          setIsRedoMode(false);
          if (remainingQuestions.length > 0) {
            loadNewQuestion(getRandomQuestion(remainingQuestions));
          } else {
            setCurrentQuestion(null);
          }
        }
      }
    } else {
      // Incorrect answer handling:
      setWrongAnimation(true);
      setLastWrongAnswer(answer);
      // Reset the progress.
      setStreak(0);
      // If not in redo mode and there are correct answers, enter redo mode.
      if (!isRedoMode && correctQuestions.length > 0) {
        setRedoQueue([...correctQuestions]);
        setIsRedoMode(true);
        loadNewQuestion(getRandomQuestion(correctQuestions));
      } else {
        // Otherwise, simply reload the same question with a red pulse.
        loadNewQuestion(currentQuestion);
      }
      // Remove the wrong animation effect after 1 second.
      setTimeout(() => {
        setWrongAnimation(false);
        setLastWrongAnswer(null);
      }, 1000);
    }
    // Clear the selected answer.
    setSelectedAnswer(null);
  };

  if (loading) return <p className="text-center text-gray-500">Loading questions...</p>;
  if (!currentQuestion)
    return <p className="text-center text-red-500">{"No questions available."}</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 relative">
      {/* Progress Bar */}
      <div className="w-full max-w-xl mb-4 relative">
        <h1 className="text-4xl font-bold">Trivia!</h1>
        </div>  
      {/* Progress Bar */}
      <div className="w-full max-w-xl mb-4 relative">
        <div
          className={`w-full h-4 bg-gray-300 rounded-full overflow-hidden ${
            wrongAnimation ? "animate-pulse bg-red-500" : ""
          }`}
        >
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${Math.min((streak / 10) * 100, 100)}%` }}
          ></div>
        </div>
        
      </div>

      {/* Quiz Container */}
      <div className={`bg-white p-6 rounded-lg shadow-md w-full max-w-xl ${newQuestionFlash ? "bg-yellow-100" : ""}`}>
        
        <QuestionCard
          question={currentQuestion}
          onSelectAnswer={handleAnswerSelect}
          isNew={newQuestionFlash}
        />
        {selectedAnswer && <p className="mt-4 text-lg font-semibold"></p>}
      </div>
    </div>
  );
}
