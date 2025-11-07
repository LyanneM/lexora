// Enhanced PythonMathNotebook.jsx - Fix execution and add better UI
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/python-math-notebook.css";

const API_BASE_URL = "http://localhost:8000";

function PythonMathNotebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState("Python Math Notebook");
  const [cells, setCells] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [variables, setVariables] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Add initial cell when component mounts
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/math-notebook/create-session`, {
          method: 'POST'
        });
        const result = await response.json();
        if (result.success) {
          setSessionId(result.session_id);
          // Add first cell
          addNewCell("code");
        }
      } catch (error) {
        console.error("Error creating session:", error);
        // Add cell anyway for offline usage
        addNewCell("code");
      }
    };

    createSession();
  }, []);

  const addNewCell = (type = "code") => {
    const newCell = {
      id: Date.now().toString(),
      type: type,
      content: type === "code" ? "# Enter Python code here\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Your code here" : "",
      output: null,
      isExecuting: false
    };
    setCells(prev => [...prev, newCell]);
  };

  const executeCell = async (cellId) => {
    const cell = cells.find(c => c.id === cellId);
    if (!cell) return;

    setCells(prev => prev.map(c => 
      c.id === cellId ? { ...c, isExecuting: true, output: null } : c
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/math-notebook/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: cell.content,
          cell_id: cellId,
          session_id: sessionId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCells(prev => prev.map(c => 
          c.id === cellId ? { 
            ...c, 
            output: result.result,
            isExecuting: false 
          } : c
        ));
        
        // Update variables if available
        if (result.result && result.result.variables) {
          setVariables(result.result.variables);
        }
      } else {
        setCells(prev => prev.map(c => 
          c.id === cellId ? { 
            ...c, 
            output: { error: result.error },
            isExecuting: false 
          } : c
        ));
      }
    } catch (error) {
      setCells(prev => prev.map(c => 
        c.id === cellId ? { 
          ...c, 
          output: { error: `Network error: ${error.message}` },
          isExecuting: false 
        } : c
      ));
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

  const clearAllCells = () => {
    setCells([]);
    setVariables({});
    addNewCell("code");
  };

  const renderOutput = (output) => {
    if (!output) return null;
    
    if (output.error) {
      return (
        <div className="cell-output error">
          <strong>Error:</strong> {output.error}
        </div>
      );
    }

    switch (output.type) {
      case "python_execution":
        return (
          <div className="cell-output python-output">
            <pre>{output.text_output}</pre>
          </div>
        );
      
      case "expression_evaluation":
        return (
          <div className="cell-output math-output">
            <div className="latex-result">${output.latex_result}$</div>
            <div className="evaluated">≈ {output.evaluated}</div>
          </div>
        );
      
      case "plot":
        return (
          <div className="cell-output plot-output">
            <img 
              src={`data:image/png;base64,${output.plot_data}`} 
              alt="Plot" 
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        );
      
      case "equation_solutions":
        return (
          <div className="cell-output solutions-output">
            <h4>Solutions:</h4>
            {output.latex_solutions.map((sol, idx) => (
              <div key={idx} className="solution">${sol}$</div>
            ))}
          </div>
        );
      
      case "variable_assignment":
        return (
          <div className="cell-output variable-output">
            <div>${output.variable} = {output.latex_value}$</div>
            <div>Evaluated: {output.evaluated}</div>
          </div>
        );
      
      default:
        return (
          <div className="cell-output generic-output">
            <pre>{JSON.stringify(output, null, 2)}</pre>
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
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="notebook-title"
              placeholder=" "
            />
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
            onClick={clearAllCells}
            className="action-btn secondary"
          >
            🗑️ Clear All
          </button>
          <button 
            onClick={() => navigate("/notebook/math")}
            className="action-btn math-tools"
          >
            Simple Math
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
          {cells.map((cell, index) => (
            <div key={cell.id} className="notebook-cell">
              <div className="cell-header">
                <span className="cell-number">
                  In [{index + 1}]:
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
                {cell.type === "code" ? (
                  <textarea
                    value={cell.content}
                    onChange={(e) => updateCellContent(cell.id, e.target.value)}
                    placeholder="# Enter Python code here...\n# You can use numpy, sympy, matplotlib\nimport numpy as np\nimport matplotlib.pyplot as plt\n\n# Example: Solve equation\nfrom sympy import symbols, solve\nx = symbols('x')\nequation = x**2 - 4\nsolution = solve(equation, x)\nprint(solution)"
                    rows={8}
                    className="code-textarea"
                  />
                ) : (
                  <textarea
                    value={cell.content}
                    onChange={(e) => updateCellContent(cell.id, e.target.value)}
                    placeholder="Enter markdown text here..."
                    rows={4}
                    className="markdown-textarea"
                  />
                )}
              </div>
              
              {cell.output && (
                <div className="cell-output-container">
                  {renderOutput(cell.output)}
                </div>
              )}
            </div>
          ))}
          
          {cells.length === 0 && (
            <div className="empty-notebook">
              <h3>No cells yet</h3>
              <p>Add a code cell to start writing Python code with mathematical capabilities.</p>
              <button 
                onClick={() => addNewCell("code")}
                className="action-btn primary"
              >
                + Add Your First Cell
              </button>
            </div>
          )}
        </div>

        <div className="variables-panel">
          <div className="panel-header">
            <h3>Variables</h3>
            <button className="refresh-btn">🔄</button>
          </div>
          <div className="variables-list">
            {Object.entries(variables).length > 0 ? (
              Object.entries(variables).map(([name, value]) => (
                <div key={name} className="variable-item">
                  <span className="variable-name">{name}</span>
                  <span className="variable-value">= {value}</span>
                </div>
              ))
            ) : (
              <div className="no-variables">
                No variables defined
                <div className="hint">Run some code to see variables here</div>
              </div>
            )}
          </div>
          
          <div className="quick-examples">
            <h4>Quick Examples:</h4>
            <div className="example-item" onClick={() => {
              addNewCell("code");
              setTimeout(() => {
                const newCell = cells[cells.length - 1];
                updateCellContent(newCell.id, `# Basic calculation\nresult = 2 + 3 * 4\nprint("Result:", result)`);
              }, 100);
            }}>
              Basic Calculation
            </div>
            <div className="example-item" onClick={() => {
              addNewCell("code");
              setTimeout(() => {
                const newCell = cells[cells.length - 1];
                updateCellContent(newCell.id, `# Solve equation\nfrom sympy import symbols, solve\nx = symbols('x')\nequation = x**2 - 4\nsolution = solve(equation, x)\nprint("Solutions:", solution)`);
              }, 100);
            }}>
              Solve Equation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PythonMathNotebook;