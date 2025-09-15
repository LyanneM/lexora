// src/pages/Notebook.jsx

import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/notebook.css";

function Notebook() {
  const { id, type } = useParams(); // Now we can get type from URL params
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [note, setNote] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [elements, setElements] = useState([]);
  const [title, setTitle] = useState("Untitled Note");
  const [isSaving, setIsSaving] = useState(false);
  const [noteType, setNoteType] = useState(type || "regular");
  
  const canvasRef = useRef(null);

  useEffect(() => {
    // If we're creating a new note (id is "create"), set the type
    if (id === "create" && type) {
      setNoteType(type);
      setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Note`);
    } else if (id && id !== "create") {
      // If we're editing an existing note, load it
      loadNote();
    }
  }, [id, type]);

  const loadNote = async () => {
    try {
      const noteDoc = await getDoc(doc(db, "notes", id));
      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        setNote(noteData);
        setTitle(noteData.title);
        setNoteType(noteData.type);
        setElements(noteData.elements || []);
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
        type: noteType,
        elements,
        updatedAt: new Date(),
        owner: currentUser.uid,
        createdAt: note ? note.createdAt : new Date()
      };

      if (id && id !== "create") {
        // Update existing note
        await updateDoc(doc(db, "notes", id), noteData);
        alert("Note updated successfully!");
      } else {
        // Create new note
        const docRef = doc(collection(db, "notes"));
        await setDoc(docRef, noteData);
        
        // Also add to user's notes array
        await updateDoc(doc(db, "users", currentUser.uid), {
          notes: arrayUnion(docRef.id)
        });
        
        alert("Note created successfully!");
        navigate(`/notebook/${docRef.id}`); // Redirect to the edit page
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note");
    }
    setIsSaving(false);
  };

  const addElement = (elementType, content = "") => {
    const newElement = {
      id: Date.now(),
      type: elementType,
      content,
      position: { x: 100, y: 100 + (elements.length * 60) },
      size: elementType === "sticky" ? { width: 200, height: 150 } : { width: 300, height: 40 }
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
            <div className="shape-content">
              <span>⬢</span>
            </div>
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
          <button onClick={() => navigate("/dashboard")}>
            ← Dashboard
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
            <p>Click on the tools above to add content to your {noteType} notebook</p>
            <p>Drag elements to move them around</p>
          </div>
        )}
      </div>

      {/* Quiz Creation Button - Only show for existing notes */}
      {id && id !== "create" && (
        <div className="quiz-creation-panel">
          <button 
            onClick={() => navigate(`/quiz/create?fromNote=${id}`)}
            className="create-quiz-btn"
          >
            🎯 Create Quiz from this Note
          </button>
        </div>
      )}
    </div>
  );
}

export default Notebook;