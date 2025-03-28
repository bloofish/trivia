"use client";

type QuestionCardProps = {
  question: {
    id: number;
    question: string;
    answers: string[];
    correct_answer: string;
  };
  onSelectAnswer: (answer: string) => void;
  wrongAnswer?: string | null;
  isNew?: boolean;
};

export default function QuestionCard({
  question,
  onSelectAnswer,
  wrongAnswer,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col justify-between h-50">
      <h2 className="text-lg font-semibold mb-3 flex-grow flex items-center justify-center text-center">
        {question.question}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {question.answers.map((answer, index) => {
          // Base styling for each answer button.
          let buttonClasses =
            "bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition";
          return (
            <button
              key={index}
              className={buttonClasses}
              onClick={() => onSelectAnswer(answer)}
            >
              {answer}
            </button>
          );
        })}
      </div>
    </div>
  );
}
