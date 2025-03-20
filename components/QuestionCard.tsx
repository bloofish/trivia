"use client";

type QuestionCardProps = {
  question: {
    id: number;
    question: string;
    answers: string[];
    correct_answer: string;
  };
  onSelectAnswer: (answer: string) => void;
};

export default function QuestionCard({ question, onSelectAnswer }: QuestionCardProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{question.question}</h2>
      <div className="grid grid-cols-2 gap-3">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
            onClick={() => onSelectAnswer(answer)}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
}
