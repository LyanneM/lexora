// src/pages/Notebook.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/notebook.css";

function Notebook() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const noteType = searchParams.get("type") || "regular";
  const { currentUser } = useAuth();
  
  const [note, setNote] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [elements, setElements] = useState([]);
  const [title, setTitle] = useState("Untitled Note");
  const [isSaving, setIsSaving] = useState(false);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    loadNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadNote = async () => {
    if (id && id !== "create") {
      try {
        const noteDoc = await getDoc(doc(db, "notes", id));
        if (noteDoc.exists()) {
          const noteData = noteDoc.data();
          setNote(noteData);
          setTitle(noteData.title);
          setElements(noteData.elements || []);
        }
      } catch (error) {
        console.error("Error loading note:", error);
      }
    }
  };

  const saveNote = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const noteData = {
        title,
        type: noteType,
        elements,
        updatedAt: new Date(),
        owner: currentUser.uid
      };

      if (id && id !== "create") {
        // Update existing note
        await updateDoc(doc(db, "notes", id), noteData);
      } else {
        // Create new note under the user
        await setDoc(
          doc(db, "users", currentUser.uid),
          { notes: arrayUnion(noteData) },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
    setIsSaving(false);
  };

  const addElement = (type, content = "") => {
    const newElement = {
      id: Date.now(),
      type,
      content,
      position: { x: 100, y: 100 },
      size: type === "sticky" ? { width: 200, height: 150 } : { width: 300, height: 40 }
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const renderElement = (element) => {
    switch (element.type) {
      case "text":
        return (
          <div className="element text-element">
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Type your text here..."
            />
          </div>
        );
      
      case "sticky":
        return (
          <div className="element sticky-note">
            <div className="sticky-header">
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
          <div className="element math-element">
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Enter LaTeX math notation (e.g., E = mc^2)"
            />
            <div className="math-preview">
              {element.content || "Math preview will appear here"}
            </div>
          </div>
        );
      
      case "code":
        return (
          <div className="element code-element">
            <select defaultValue="javascript">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(element.id, { content: e.target.value })}
              placeholder="Write your code here..."
              className="code-editor"
            />
          </div>
        );

      case "shape":
        return (
          <div className="element shape-element">
            ⬢ Shape Placeholder
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="notebook-container">
      {/* Toolbar */}
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
            📝 Text
          </button>
          <button 
            className={activeTool === "sticky" ? "active" : ""}
            onClick={() => addElement("sticky")}
          >
            📌 Sticky Note
          </button>
          {noteType === "math" && (
            <button 
              className={activeTool === "math" ? "active" : ""}
              onClick={() => addElement("math")}
            >
              π Math Equation
            </button>
          )}
          {noteType === "technical" && (
            <button 
              className={activeTool === "code" ? "active" : ""}
              onClick={() => addElement("code")}
            >
              {"</>"} Code Block
            </button>
          )}
          <button 
            className={activeTool === "shape" ? "active" : ""}
            onClick={() => addElement("shape")}
          >
            ⬢ Shape
          </button>
        </div>

        <div className="action-buttons">
          <button onClick={saveNote} disabled={isSaving}>
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
          <button onClick={() => window.history.back()}>
            ← Back
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="notebook-canvas" ref={canvasRef}>
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
            <p>Click on the tools above to add content to your notebook</p>
            <p>Drag elements to move them around</p>
          </div>
        )}
      </div>

      {/* Quiz Creation Button */}
      <div className="quiz-creation-panel">
        <button 
          onClick={() => window.location.href = `/quiz/create?fromNote=${id || 'new'}`}
          className="create-quiz-btn"
        >
          🎯 Create Quiz from this Note
        </button>
      </div>
    </div>
  );
}

export default Notebook;
