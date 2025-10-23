// src/pages/PythonMathNotebook.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/python-math-notebook.css";

const API_BASE_URL = "http://localhost:8000";

function PythonMathNotebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState("");
  const [cells, setCells] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [variables, setVariables] = useState({});

  const addNewCell = (type = "code") => {
    const newCell = {
      id: Date.now().toString(),
      type: type,
      content: "",
      output: null,
      isExecuting: false
    };
    setCells(prev => [...prev, newCell]);
  };

  const executeCell = async (cellId) => {
    setCells(prev => prev.map(cell => 
      cell.id === cellId ? { ...cell, isExecuting: true } : cell
    ));

    const cell = cells.find(c => c.id === cellId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/math-notebook/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: cell.content,
          cell_id: cellId
        })
      });

      const result = await response.json();
      
      setCells(prev => prev.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: result.success ? result.result : { error: result.error },
          isExecuting: false 
        } : c
      ));

      
      if (sessionId) {
        fetchVariables();
      }
    } catch (error) {
      setCells(prev => prev.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: { error: error.message },
          isExecuting: false 
        } : c
      ));
    }
  };

  const fetchVariables = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/math-notebook/session/${sessionId}/variables`);
      const result = await response.json();
      if (result.success) {
        setVariables(result.variables);
      }
    } catch (error) {
      console.error("Error fetching variables:", error);
    }
  };

  const updateCellContent = (cellId, content) => {
    setCells(prev => prev.map(cell => 
      cell.id === cellId ? { ...cell, content } : cell
    ));
  };

  const removeCell = (cellId) => {
    setCells(prev => prev.filter(cell => cell.id !== cellId));
  };

  useEffect(() => {
    // Create a session when component mounts
    const createSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/math-notebook/create-session`, {
          method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
          setSessionId(result.session_id);
        }
      } catch (error) {
        console.error("Error creating session:", error);
      }
    };

    createSession();
    // Add first cell
    addNewCell();
  }, []);

  const renderOutput = (output) => {
    if (!output) return null;
    
    if (output.error) {
      return <div className="cell-output error">{output.error}</div>;
    }

    const { output: result } = output;
    
    switch (result.type) {
      case "python_execution":
        return (
          <div className="cell-output python-output">
            <pre>{result.text_output}</pre>
          </div>
        );
      
      case "expression_evaluation":
        return (
          <div className="cell-output math-output">
            <div className="latex-result">${result.latex_result}$</div>
            <div className="evaluated">≈ {result.evaluated}</div>
          </div>
        );
      
      case "plot":
        return (
          <div className="cell-output plot-output">
            <img 
              src={`data:image/png;base64,${result.plot_data}`} 
              alt="Plot" 
            />
          </div>
        );
      
      case "equation_solutions":
        return (
          <div className="cell-output solutions-output">
            <h4>Solutions:</h4>
            {result.latex_solutions.map((sol, idx) => (
              <div key={idx} className="solution">${sol}$</div>
            ))}
          </div>
        );
      
      case "variable_assignment":
        return (
          <div className="cell-output variable-output">
            <div>${result.variable} = {result.latex_value}$</div>
            <div>Evaluated: {result.evaluated}</div>
          </div>
        );
      
      default:
        return (
          <div className="cell-output generic-output">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="python-math-notebook">
     <div className="notebook-toolbar">
  <div className="title-section">
    <div className="title-icon">🐍</div>
    <div className="title-input-container">
      <span className="notebook-type">Python Math Notebook</span>
    </div>
  </div>
  
  <div className="notebook-actions">
  <button 
    onClick={() => addNewCell("code")}
    className="action-btn primary"
  >
    + Code Cell
  </button>
  <button 
    onClick={() => addNewCell("markdown")}
    className="action-btn secondary"
  >
    + Text Cell
  </button>
  <button 
    onClick={() => navigate("/notebook/math")}
    className="action-btn math-tools"
  >Simple Math
  </button>
  <button 
    onClick={() => navigate("/dashboard")}
    className="action-btn dashboard"
  >
    ← Dashboard
  </button>
</div>
</div>
        
      <div className="notebook-content">
        <div className="cells-container">
          {cells.map((cell) => (
            <div key={cell.id} className="notebook-cell">
              <div className="cell-header">
                <span className="cell-number">
                  In [{cells.findIndex(c => c.id === cell.id) + 1}]:
                </span>
                <div className="cell-actions">
                  <button 
                    onClick={() => executeCell(cell.id)}
                    disabled={cell.isExecuting}
                    className={`execute-btn ${cell.isExecuting ? 'executing' : ''}`}
                  >
                    {cell.isExecuting ? "⏳ Executing..." : "▶ Run"}
                  </button>
                  <button 
                    onClick={() => removeCell(cell.id)}
                    className="delete-btn"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="cell-input">
                <textarea
                  value={cell.content}
                  onChange={(e) => updateCellContent(cell.id, e.target.value)}
                  placeholder={cell.type === "code" 
                    ? "# Enter Python code here...\nimport math\nimport numpy as np\n\n# Your code here" 
                    : "Enter markdown text here..."}
                  rows={6}
                />
              </div>
              
              {cell.output && (
                <div className="cell-output-container">
                  {renderOutput(cell.output)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="variables-panel">
          <div className="panel-header">
            <h3>Variables</h3>
            <button onClick={fetchVariables} className="refresh-btn">🔄</button>
          </div>
          <div className="variables-list">
            {Object.entries(variables).map(([name, value]) => (
              <div key={name} className="variable-item">
                <span className="variable-name">{name}</span>
                <span className="variable-value">= {value}</span>
              </div>
            ))}
            {Object.keys(variables).length === 0 && (
              <div className="no-variables">
                No variables defined
                <div className="hint">Run some code to see variables here</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PythonMathNotebook;