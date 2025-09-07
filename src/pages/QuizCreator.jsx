// src/pages/QuizCreator.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/quiz-creator.css";

function QuizCreator() {
  const [searchParams] = useSearchParams();
  const fromNote = searchParams.get("fromNote");
  const { currentUser } = useAuth();
  
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    if (fromNote && fromNote !== "new") {
      loadNoteContent();
    }
  }, [fromNote]);

  const loadNoteContent = async () => {
    try {
      const noteDoc = await getDoc(doc(db, "notes", fromNote));
      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        setNoteContent(JSON.stringify(noteData.elements));
        // Auto-generate questions from note content
        generateQuestionsFromNote(noteData.elements);
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  const generateQuestionsFromNote = (elements) => {
    // Simple question generation logic
    const textElements = elements.filter(el => el.type === "text" && el.content);
    const generatedQuestions = textElements.slice(0, 3).map((el, index) => ({
      question: `Question about: ${el.content.substring(0, 50)}...`,
      options: ["True", "False", "Maybe", "Not sure"],
      correctAnswer: 0
    }));
    
    setQuestions(generatedQuestions);
  };

  const addQuestion = () => {
    if (currentQuestion && options.every(opt => opt.trim() !== "")) {
      const newQuestion = {
        question: currentQuestion,
        options: [...options],
        correctAnswer
      };
      
      setQuestions([...questions, newQuestion]);
      setCurrentQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
    }
  };

  const saveQuiz = async () => {
    try {
      await addDoc(collection(db, "quizzes"), {
        title: quizTitle,
        questions,
        owner: currentUser.uid,
        createdAt: new Date(),
        fromNote: fromNote || null
      });
      
      alert("Quiz saved successfully!");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Error saving quiz");
    }
  };

  return (
    <div className="quiz-creator-container">
      <div className="quiz-header">
        <h1>Create New Quiz</h1>
        <input
          type="text"
          placeholder="Quiz Title"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          className="quiz-title-input"
        />
      </div>

      <div className="quiz-creator-layout">
        {/* Question Form */}
        <div className="question-form">
          <h3>Add New Question</h3>
          
          <textarea
            placeholder="Enter your question"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            className="question-input"
          />
          
          <div className="options-container">
            {options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswer === index}
                  onChange={() => setCorrectAnswer(index)}
                />
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                />
              </div>
            ))}
          </div>
          
          <button onClick={addQuestion} className="add-question-btn">
            Add Question
          </button>
        </div>

        {/* Questions List */}
        <div className="questions-list">
          <h3>Questions ({questions.length})</h3>
          
          {questions.map((q, index) => (
            <div key={index} className="question-item">
              <h4>Q{index + 1}: {q.question}</h4>
              <ul>
                {q.options.map((opt, optIndex) => (
                  <li key={optIndex} className={optIndex === q.correctAnswer ? "correct" : ""}>
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {questions.length > 0 && (
            <button onClick={saveQuiz} className="save-quiz-btn">
              Save Quiz
            </button>
          )}
        </div>

        {/* Note Preview (if from note) */}
        {fromNote && fromNote !== "new" && (
          <div className="note-preview">
            <h3>Note Content</h3>
            <div className="preview-content">
              {noteContent || "Loading note content..."}
            </div>
            <button onClick={() => generateQuestionsFromNote(JSON.parse(noteContent))}>
              Auto-generate Questions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizCreator;