// src/components/NoteTypeSelector.jsx
import { useNavigate } from "react-router-dom";
import "../styles/note-type-selector.css";

function NoteTypeSelector() {
  const navigate = useNavigate();

  const handleNoteTypeSelect = (type) => {
    navigate(`/notebook/create?type=${type}`);
  };

  return (
    <div className="note-type-selector">
      <div className="selector-header">
        <h2>Create New Note</h2>
        <p>Choose the type of note you want to create</p>
      </div>
      
      <div className="type-options">
        <div className="type-card" onClick={() => handleNoteTypeSelect("regular")}>
          <div className="type-icon">📝</div>
          <h3>Regular Notes</h3>
          <p>Standard text-based notes with formatting options</p>
        </div>
        
        <div className="type-card" onClick={() => handleNoteTypeSelect("math")}>
          <div className="type-icon">π</div>
          <h3>Mathematical Notes</h3>
          <p>Notes with equation editor and math symbols support</p>
        </div>
        
        <div className="type-card" onClick={() => handleNoteTypeSelect("technical")}>
          <div className="type-icon">💻</div>
          <h3>Technical Notes</h3>
          <p>Code snippets, diagrams, and technical documentation</p>
        </div>
      </div>
    </div>
  );
}

export default NoteTypeSelector;