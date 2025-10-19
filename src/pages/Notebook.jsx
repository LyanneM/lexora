// src/pages/Notebook.jsx (Enhanced with Infinite Canvas)
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { QuizApiService } from "../utils/quizApiService";
import "../styles/notebook-enhanced.css";

function Notebook() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [note, setNote] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [elements, setElements] = useState([]);
  const [title, setTitle] = useState("Untitled Note");
  const [isSaving, setIsSaving] = useState(false);
  const [noteType, setNoteType] = useState(type || "regular");
  const [pageStyle, setPageStyle] = useState("ruled"); // ruled, blank, grid
  const [selectedColor, setSelectedColor] = useState("#ffeb3b");
  
  // AI Companion States
  const [showAICompanion, setShowAICompanion] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  
  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const selectedElement = useRef(null);
  const canvasPan = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (id === "create" && type) {
      setNoteType(type);
      setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Note`);
    } else if (id && id !== "create") {
      loadNote();
    }
  }, [id, type]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadNote = async () => {
    try {
      const noteDoc = await getDoc(doc(db, "notes", id));
      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        setNote(noteData);
        setTitle(noteData.title);
        setNoteType(noteData.type);
        setElements(noteData.elements || []);
        setPageStyle(noteData.pageStyle || "ruled");
      }
    } catch (error) {
      console.error("Error loading note:", error);
    }
  };

  const askAI = async (message) => {
    setIsLoading(true);
    try {
      console.log("🤖 Sending message to AI:", message);
      
      const response = await QuizApiService.chatWithAI(
        message,
        currentUser?.uid || 'anonymous',
        conversationId
      );

      console.log("🤖 AI Response:", response);

      const aiResponse = {
        id: Date.now(),
        type: 'ai',
        content: response.response || "I'm here to help with your notes!",
        timestamp: new Date().toLocaleTimeString()
      };

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      setConversation(prev => [...prev, aiResponse]);
      return aiResponse;

    } catch (error) {
      console.error('AI chat error:', error);
      const errorResponse = {
        id: Date.now(),
        type: 'ai',
        content: "I'm having temporary connection issues, but I'm still here to help! You can continue working on your notes, and I'll assist as much as possible.",
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString()
    };

    setConversation(prev => [...prev, userMessage]);
    setUserInput('');

    await askAI(userInput);
  };

  // Handle Shift+Enter for new lines
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow new line
      return;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleQuickAction = (action) => {
    let message = '';
    const noteContent = getNoteContent();
    
    switch(action) {
      case 'summarize':
        message = `Can you summarize this note? Here's the content: ${noteContent}`;
        break;
      case 'explain':
        message = `Can you explain the concepts in this note? Content: ${noteContent}`;
        break;
      case 'quiz':
        message = `Can you create a quiz based on this note? Content: ${noteContent}`;
        break;
      case 'examples':
        message = `Can you provide examples related to this note? Content: ${noteContent}`;
        break;
      case 'improve':
        message = `Can you suggest improvements for this note? Content: ${noteContent}`;
        break;
      default:
        message = action;
    }

    setUserInput(message);
  };

  const getNoteContent = () => {
    const textContent = elements
      .map(element => element.content)
      .filter(content => content && content.trim())
      .join('\n\n');
    
    return textContent || "This note doesn't have much content yet. Please add some text to get AI assistance.";
  };

  const clearConversation = () => {
    setConversation([]);
    setConversationId(null);
  };

  const toggleAICompanion = () => {
    setShowAICompanion(!showAICompanion);
    if (!showAICompanion && conversation.length === 0) {
      setConversation([{
        id: Date.now(),
        type: 'ai',
        content: "Hello! I'm your AI study companion. I can help you summarize, explain, create quizzes, and more based on your notes. What would you like help with?",
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const saveNote = async () => {
    setIsSaving(true);
    try {
      const noteData = {
        title,
        type: noteType,
        elements,
        pageStyle,
        updatedAt: new Date(),
        owner: currentUser.uid,
        createdAt: note ? note.createdAt : new Date()
      };

      if (id && id !== "create") {
        await updateDoc(doc(db, "notes", id), noteData);
        alert("Note updated successfully!");
      } else {
        const docRef = doc(collection(db, "notes"));
        await setDoc(docRef, noteData);
        
        await updateDoc(doc(db, "users", currentUser.uid), {
          notes: arrayUnion(docRef.id)
        });
        
        alert("Note created successfully!");
        navigate(`/notebook/${docRef.id}`);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note");
    }
    setIsSaving(false);
  };

  // Enhanced element creation with better positioning
  const addElement = (elementType, content = "") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2 - canvasPan.current.x;
    const centerY = rect.height / 2 - canvasPan.current.y;

    const baseSizes = {
      text: { width: 400, height: 120 },
      sticky: { width: 250, height: 200 },
      math: { width: 350, height: 150 },
      code: { width: 500, height: 300 },
      shape: { width: 150, height: 150 },
      highlighter: { width: 200, height: 30 }
    };

    const newElement = {
      id: Date.now(),
      type: elementType,
      content,
      position: { x: centerX, y: centerY },
      size: baseSizes[elementType],
      color: elementType === "sticky" ? selectedColor : null,
      rotation: elementType === "sticky" ? Math.random() * 8 - 4 : 0 // slight rotation for sticky notes
    };
    
    setElements([...elements, newElement]);
  };

  const updateElement = (elementId, updates) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (elementId) => {
    setElements(elements.filter(el => el.id !== elementId));
  };

  // Mouse event handlers for infinite canvas
  const handleMouseDown = (e, element = null) => {
    if (e.button !== 0) return; // Only left click
    
    if (element && activeTool === "select") {
      // Start dragging element
      isDragging.current = true;
      selectedElement.current = element;
      const rect = e.currentTarget.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - element.position.x,
        y: e.clientY - element.position.y
      };
    } else {
      // Start panning canvas
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging.current && selectedElement.current) {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      updateElement(selectedElement.current.id, {
        position: { x: newX, y: newY }
      });
    } else if (isPanning.current) {
      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;
      
      canvasPan.current.x += deltaX;
      canvasPan.current.y += deltaY;
      
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      
      // Update canvas transform
      if (canvasRef.current) {
        canvasRef.current.style.transform = `translate(${canvasPan.current.x}px, ${canvasPan.current.y}px)`;
      }
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isPanning.current = false;
    selectedElement.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = isPanning.current ? "grabbing" : "grab";
    }
  };

  // Sticky note colors
  const stickyColors = [
    "#ffeb3b", "#ffcdd2", "#c8e6c9", "#bbdefb", "#e1bee7", 
    "#ffccbc", "#f0f4c3", "#d7ccc8", "#cfd8dc", "#ffffff"
  ];

  const renderElement = (element) => {
    const commonProps = {
      onMouseDown: (e) => handleMouseDown(e, element),
      style: {
        transform: `rotate(${element.rotation}deg)`,
        backgroundColor: element.color || 'transparent'
      }
    };

    switch (element.type) {
      case "text":
        return (
          <div className="element text-element" {...commonProps}>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Type your text here..."
              style={{ height: '100%', resize: 'none' }}
            />
          </div>
        );
      
      case "sticky":
        return (
          <div className="element sticky-note" {...commonProps}>
            <div className="sticky-header">
              <div className="color-picker-mini">
                {stickyColors.map(color => (
                  <div
                    key={color}
                    className={`color-option ${element.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateElement(element.id, { color });
                    }}
                  />
                ))}
              </div>
              <button onClick={() => deleteElement(element.id)}>×</button>
            </div>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Write your note..."
            />
          </div>
        );
      
      case "math":
        return (
          <div className="element math-element" {...commonProps}>
            <div className="math-toolbar">
              <span>Math Equation</span>
              <button onClick={() => deleteElement(element.id)}>×</button>
            </div>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Enter LaTeX: E = mc^2, \frac{a}{b}, \int f(x)dx"
              className="math-input"
            />
            <div className="math-preview">
              {element.content || "Math preview will appear here"}
            </div>
          </div>
        );
      
      case "code":
        return (
          <div className="element code-element" {...commonProps}>
            <div className="code-header">
              <select defaultValue="python">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
              <button className="run-code">▶ Run</button>
              <button onClick={() => deleteElement(element.id)}>×</button>
            </div>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Write your code here..."
              className="code-editor"
            />
            <div className="code-output">
              <pre>Output will appear here</pre>
            </div>
          </div>
        );
      
      case "highlighter":
        return (
          <div className="element highlighter-element" {...commonProps}>
            <div 
              className="highlighter-line"
              style={{ backgroundColor: element.color || '#ffeb3b' }}
            />
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Highlighted text..."
              style={{ 
                backgroundColor: element.color ? `${element.color}40` : '#ffeb3b40',
                border: 'none'
              }}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="notebook-container">
      {/* Enhanced Toolbar */}
      <div className="notebook-toolbar">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="note-title"
          placeholder="Note title"
        />
        
        <div className="tool-selection">
          <button 
            className={activeTool === "select" ? "active" : ""}
            onClick={() => setActiveTool("select")}
          >
            ✋ Select
          </button>
          <button 
            className={activeTool === "text" ? "active" : ""}
            onClick={() => addElement("text")}
          >
            📝 Text Box
          </button>
          <button 
            className={activeTool === "sticky" ? "active" : ""}
            onClick={() => addElement("sticky")}
          >
            📌 Sticky Note
          </button>
          <button 
            className={activeTool === "highlighter" ? "active" : ""}
            onClick={() => addElement("highlighter")}
          >
            🖍️ Highlighter
          </button>
          
          {/* Page Style Selector */}
          <select 
            value={pageStyle} 
            onChange={(e) => setPageStyle(e.target.value)}
            className="page-style-selector"
          >
            <option value="ruled">📏 Ruled</option>
            <option value="grid">🔲 Grid</option>
            <option value="blank">⬜ Blank</option>
          </select>
        </div>

        <div className="action-buttons">
          <button 
            onClick={toggleAICompanion} 
            className={`ai-companion-btn ${showAICompanion ? 'active' : ''}`}
          >
            {showAICompanion ? "🤖 Hide AI" : "🤖 AI Companion"}
          </button>
          <button onClick={saveNote} disabled={isSaving}>
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
          <button onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="notebook-content">
        {/* Infinite Canvas Area */}
        <div 
          className={`notebook-canvas ${pageStyle} ${showAICompanion ? 'with-ai' : ''}`}
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {elements.map(element => (
            <div
              key={element.id}
              className="canvas-element"
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.size.width,
                height: element.size.height
              }}
            >
              {renderElement(element)}
            </div>
          ))}
          
          {elements.length === 0 && (
            <div className="empty-canvas">
              <h3>Welcome to Your {noteType.charAt(0).toUpperCase() + noteType.slice(1)} Notebook!</h3>
              <p>• Click on tools to add content</p>
              <p>• Drag to move elements around</p>
              <p>• Use mouse wheel to zoom, drag to pan</p>
              <button 
                onClick={toggleAICompanion}
                className="get-help-btn"
              >
                🤖 Need help? Ask the AI Companion
              </button>
            </div>
          )}
        </div>

        {/* Enhanced AI Companion Panel */}
        {showAICompanion && (
          <div className="ai-companion-panel">
            <div className="ai-header">
              <h3>🤖 AI Study Companion</h3>
              <button onClick={clearConversation} className="clear-chat-btn">
                🗑️ Clear
              </button>
            </div>

            <div className="ai-quick-actions">
              <button onClick={() => handleQuickAction('summarize')}>
                📋 Summarize
              </button>
              <button onClick={() => handleQuickAction('explain')}>
                💡 Explain
              </button>
              <button onClick={() => handleQuickAction('quiz')}>
                🎯 Create Quiz
              </button>
              <button onClick={() => handleQuickAction('examples')}>
                🌟 Examples
              </button>
              <button onClick={() => handleQuickAction('improve')}>
                ✨ Improve
              </button>
            </div>

            <div className="messages-container">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.type} ${message.isError ? 'error' : ''}`}
                >
                  <div className="message-avatar">
                    {message.type === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {message.content.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                    <div className="message-timestamp">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message ai loading">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="input-container">
              <div className="input-wrapper">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your notes... (Shift+Enter for new line)"
                  disabled={isLoading}
                  className="message-input"
                  rows="3"
                />
                <button 
                  type="submit" 
                  disabled={!userInput.trim() || isLoading}
                  className="send-button"
                >
                  {isLoading ? '⏳' : '📤'}
                </button>
              </div>
              <div className="input-hint">
                💡 Press Enter to send, Shift+Enter for new line
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notebook;