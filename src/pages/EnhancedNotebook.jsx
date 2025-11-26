// src/pages/EnhancedNotebook.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notesService } from "../services/firebaseService";
import { QuizApiService } from "../utils/quizApiService";
import "../styles/enhanced-notebook.css";

// Conversion function for old notebook format
const convertToEnhanced = (oldNotebook) => {
  // If already in enhanced format or no elements, return as-is
  if (!oldNotebook.elements || !Array.isArray(oldNotebook.elements)) {
    return {
      title: oldNotebook.title,
      type: oldNotebook.type || "regular",
      content: oldNotebook.content || "",
      owner: oldNotebook.owner,
      createdAt: oldNotebook.createdAt,
      originalFormat: oldNotebook.elements ? "enhanced" : "unknown"
    };
  }
  
  // Convert canvas elements to text
  const contentParts = [];
  
  oldNotebook.elements.forEach(element => {
    if (element.content && element.content.trim()) {
      let elementContent = element.content.trim();
      
      // Add element type context for better organization
      switch (element.type) {
        case 'text':
          contentParts.push(elementContent);
          break;
        case 'sticky':
          contentParts.push(`📝 ${elementContent}`);
          break;
        case 'math':
          contentParts.push(`🧮 Math Equation: ${elementContent}`);
          break;
        case 'code':
          contentParts.push(`💻 Code:\n${elementContent}`);
          break;
        case 'highlighter':
          contentParts.push(`🖍️ Highlighted: ${elementContent}`);
          break;
        default:
          contentParts.push(elementContent);
      }
    }
  });
  
  const content = contentParts.join('\n\n');
  
  return {
    title: oldNotebook.title,
    type: oldNotebook.type || "regular",
    content: content,
    owner: oldNotebook.owner,
    createdAt: oldNotebook.createdAt,
    originalFormat: "canvas",
    convertedAt: new Date()
  };
};

function EnhancedNotebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [activePanel, setActivePanel] = useState("editor");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Untitled Notebook");
  const [isSaving, setIsSaving] = useState(false);
  const [notebookType, setNotebookType] = useState("regular");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [wasConverted, setWasConverted] = useState(false);

  const editorRef = useRef(null);

  // Load note if editing existing
  useEffect(() => {
    if (id && id !== "create") {
      loadNote();
    }
  }, [id]);

  const loadNote = async () => {
    try {
      const noteData = await notesService.getNote(id);
      if (noteData) {
        // Check if this is an old notebook format that needs conversion
        if (noteData.elements && Array.isArray(noteData.elements)) {
          // Convert old format to enhanced format
          const convertedNote = convertToEnhanced(noteData);
          setTitle(convertedNote.title);
          setContent(convertedNote.content);
          setNotebookType(convertedNote.type);
          setWasConverted(true);
          
          console.log("✅ Converted old notebook format to enhanced format");
        } else {
          // Already in enhanced format
          setTitle(noteData.title);
          setContent(noteData.content || "");
          setNotebookType(noteData.type || "regular");
          setWasConverted(false);
        }
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  const saveNote = async () => {
    setIsSaving(true);
    try {
      const noteData = {
        title,
        type: notebookType,
        content,
        updatedAt: new Date(),
        owner: currentUser.uid,
        createdAt: id && id !== "create" ? undefined : new Date()
      };

      if (id && id !== "create") {
        await notesService.updateNote(id, noteData);
        alert("Note updated successfully!");
      } else {
        const newNoteId = await notesService.createNote(noteData);
        navigate(`/notebook-enhanced/${newNoteId}`);
        alert("Note created successfully!");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note");
    }
    setIsSaving(false);
  };

  const askAI = async (prompt) => {
    if (!content.trim()) {
      setAiResponse("Please add some content to your note first so I can help you!");
      setActivePanel("chat");
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await QuizApiService.chatWithAI(
        `${prompt}\n\nNote Content: ${content}`,
        currentUser.uid
      );
      setAiResponse(response.response);
      setActivePanel("chat");
    } catch (error) {
      setAiResponse("Sorry, I couldn't process your request. Please try again. Error: " + error.message);
    }
    setIsAiLoading(false);
  };

  // In EnhancedNotebook.jsx, update generateQuizFromNote:
const generateQuizFromNote = async () => {
  try {
    if (!content.trim()) {
      alert("Please add some content to your note first!");
      return;
    }

    console.log("📝 Generating quiz from note content...");
    const quizData = await QuizApiService.generateQuizWithFallback(content, {
      numQuestions: 10,  // Reduced from 50 for better quality
      quizType: 'mixed',
      subject: title || 'General Knowledge'
    });
    
    if (quizData.quiz_data?.questions?.length > 0) {
      // Save the generated quiz
      const quizId = await notesService.createQuiz({
        title: `Quiz: ${title}`,
        questions: quizData.quiz_data.questions,
        sourceNoteId: id,
        owner: currentUser.uid,
        generatedBy: quizData.quiz_data.metadata?.generated_by || 'ai'
      });
      
      console.log(`✅ Generated ${quizData.quiz_data.questions.length} questions`);
      navigate(`/quiz/${quizId}`);
    } else {
      alert("Failed to generate quiz questions. Please try with more content.");
    }
  } catch (error) {
    console.error("Quiz generation error:", error);
    alert("Error generating quiz: " + error.message);
  }
};


  // Quick AI Actions
  const quickActions = [
    { label: "📋 Summarize", action: "Summarize this note in key points" },
    { label: "💡 Explain", action: "Explain the main concepts in simpler terms" },
    { label: "🌟 Examples", action: "Provide practical examples related to this content" },
    { label: "🎯 Quiz Me", action: "Create quiz questions from this content" }
  ];

  return (
    <div className="enhanced-notebook">
      {/* Header */}
      <div className="notebook-header">
        <div className="header-left">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="notebook-title"
            placeholder="Notebook Title"
          />
          <span className="notebook-type">{notebookType}</span>
          {wasConverted && (
            <span className="conversion-badge" title="This note was automatically converted from the old format">
              🔄 Converted
            </span>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => askAI("Help me improve this note")}
            disabled={isAiLoading}
            className="ai-button"
          >
            {isAiLoading ? "🤔 Thinking..." : "🤖 AI Assist"}
          </button>
          <button onClick={generateQuizFromNote} className="quiz-button">
            🎯 Generate Quiz
          </button>
          <button onClick={saveNote} disabled={isSaving} className="save-button">
            {isSaving ? "💾 Saving..." : "💾 Save"}
          </button>
          <button onClick={() => navigate("/dashboard")} className="back-button">
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="notebook-main">
        {/* Sidebar */}
        <div className="notebook-sidebar">
          <div className="sidebar-section">
            <h4>🚀 Quick Actions</h4>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => askAI(action.action)}
                disabled={isAiLoading}
                className="quick-action-btn"
              >
                {action.label}
              </button>
            ))}
          </div>
          
          <div className="sidebar-section">
            <h4>🛠️ Tools</h4>
            <button 
              onClick={() => setActivePanel("editor")}
              className={activePanel === "editor" ? "active" : ""}
            >
              📝 Editor
            </button>
            <button 
              onClick={() => setActivePanel("preview")}
              className={activePanel === "preview" ? "active" : ""}
            >
              👀 Preview
            </button>
            <button 
              onClick={() => setActivePanel("chat")}
              className={activePanel === "chat" ? "active" : ""}
            >
              🤖 AI Chat
            </button>
          </div>
        </div>

        {/* Editor/Preview Area */}
        <div className="notebook-content">
          {activePanel === "editor" && (
            <div className="editor-panel">
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="notebook-editor"
                placeholder="Start writing your notes here... You can use simple formatting with line breaks and paragraphs.

The AI assistant can help you summarize, explain, and create quizzes from your content!"
                spellCheck="false"
              />
            </div>
          )}

          {activePanel === "preview" && (
            <div className="preview-panel">
              <div className="preview-content">
                {content ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {content}
                  </div>
                ) : (
                  <p className="preview-placeholder">
                    Write something in the editor to see the preview...
                  </p>
                )}
              </div>
            </div>
          )}

          {activePanel === "chat" && (
            <div className="chat-panel">
              <div className="chat-response">
                {aiResponse ? (
                  <div className="ai-response">
                    <h4>🤖 AI Assistant:</h4>
                    <div className="response-content">
                      {aiResponse.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="chat-welcome">
                    <h4>🤖 AI Study Companion</h4>
                    <p>Ask me to help with your notes! I can:</p>
                    <ul>
                      <li>📋 Summarize and extract key points</li>
                      <li>💡 Explain complex concepts</li>
                      <li>🎯 Create quiz questions</li>
                      <li>🌟 Provide examples</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Ask a question about your notes... (Press Enter to send)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      askAI(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="chat-input-field"
                  disabled={isAiLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="notebook-statusbar">
        <span>📝 {activePanel === 'editor' ? 'Editing' : activePanel === 'preview' ? 'Previewing' : 'Chatting'}</span>
        <span>📊 Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
        <span>💾 Last saved: {new Date().toLocaleTimeString()}</span>
        {wasConverted && <span>🔄 Converted from old format</span>}
      </div>
    </div>
  );
}

export default EnhancedNotebook;