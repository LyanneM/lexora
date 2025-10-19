// src/pages/MathNotebook.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/math-notebook.css";

function MathNotebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("Math Notebook");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTool, setActiveTool] = useState("calculator");
  const [graphElements, setGraphElements] = useState([]);
  const [calculatorInput, setCalculatorInput] = useState("");
  const [calculatorResult, setCalculatorResult] = useState("");
  const [graphEquation, setGraphEquation] = useState("x^2");
  const [graphType, setGraphType] = useState("function");

  const canvasRef = useRef(null);
  const graphRef = useRef(null);

  // Advanced calculator functions
  const calculate = (expression) => {
    try {
      // Basic arithmetic
      let result = expression
        .replace(/π/g, Math.PI)
        .replace(/e/g, Math.E)
        .replace(/√(\d+)/g, 'Math.sqrt($1)')
        .replace(/(\d+)!/g, 'factorial($1)')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**');

      // Evaluate the expression
      const evalResult = eval(result);
      return evalResult.toString();
    } catch (error) {
      return "Error";
    }
  };

  const factorial = (n) => {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const handleCalculatorInput = (value) => {
    if (value === "=") {
      const result = calculate(calculatorInput);
      setCalculatorResult(result);
    } else if (value === "C") {
      setCalculatorInput("");
      setCalculatorResult("");
    } else if (value === "⌫") {
      setCalculatorInput(prev => prev.slice(0, -1));
    } else {
      setCalculatorInput(prev => prev + value);
    }
  };

  const renderGraph = () => {
    const canvas = graphRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#3e3e42';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Plot function if equation exists
    if (graphEquation) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let x = -10; x <= 10; x += 0.1) {
        try {
          const y = eval(graphEquation.replace(/x/g, `(${x})`));
          const pixelX = (x + 10) * (width / 20);
          const pixelY = height - ((y + 10) * (height / 20));
          
          if (x === -10) {
            ctx.moveTo(pixelX, pixelY);
          } else {
            ctx.lineTo(pixelX, pixelY);
          }
        } catch (e) {
          // Skip invalid points
        }
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (graphRef.current) {
      renderGraph();
    }
  }, [graphEquation, graphType]);

  const mathSymbols = [
    'π', 'e', '√', '^', '(', ')', 'sin', 'cos', 'tan', 'log', 'ln'
  ];

  return (
    <div className="math-notebook-container">
      <div className="math-toolbar">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="math-title"
          placeholder="Math Notebook Title"
        />
        
        <div className="math-tools">
          <button 
            className={activeTool === "calculator" ? "active" : ""}
            onClick={() => setActiveTool("calculator")}
          >
            🧮 Calculator
          </button>
          <button 
            className={activeTool === "graph" ? "active" : ""}
            onClick={() => setActiveTool("graph")}
          >
            📈 Graphing
          </button>
          <button 
            className={activeTool === "geometry" ? "active" : ""}
            onClick={() => setActiveTool("geometry")}
          >
            📐 Geometry
          </button>
          <button 
            className={activeTool === "equations" ? "active" : ""}
            onClick={() => setActiveTool("equations")}
          >
            ⚖️ Equations
          </button>
        </div>

        <div className="math-actions">
          <button onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="math-content">
        {/* Calculator Panel */}
        {activeTool === "calculator" && (
          <div className="calculator-panel">
            <div className="calculator-display">
              <div className="calculator-input">{calculatorInput}</div>
              <div className="calculator-result">{calculatorResult}</div>
            </div>
            
            <div className="calculator-buttons">
              <div className="math-symbols">
                {mathSymbols.map(symbol => (
                  <button 
                    key={symbol}
                    onClick={() => handleCalculatorInput(symbol)}
                    className="math-symbol-btn"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
              
              <div className="calculator-grid">
                <button onClick={() => handleCalculatorInput('C')}>C</button>
                <button onClick={() => handleCalculatorInput('⌫')}>⌫</button>
                <button onClick={() => handleCalculatorInput('%')}>%</button>
                <button onClick={() => handleCalculatorInput('/')}>/</button>

                <button onClick={() => handleCalculatorInput('7')}>7</button>
                <button onClick={() => handleCalculatorInput('8')}>8</button>
                <button onClick={() => handleCalculatorInput('9')}>9</button>
                <button onClick={() => handleCalculatorInput('*')}>×</button>

                <button onClick={() => handleCalculatorInput('4')}>4</button>
                <button onClick={() => handleCalculatorInput('5')}>5</button>
                <button onClick={() => handleCalculatorInput('6')}>6</button>
                <button onClick={() => handleCalculatorInput('-')}>-</button>

                <button onClick={() => handleCalculatorInput('1')}>1</button>
                <button onClick={() => handleCalculatorInput('2')}>2</button>
                <button onClick={() => handleCalculatorInput('3')}>3</button>
                <button onClick={() => handleCalculatorInput('+')}>+</button>

                <button onClick={() => handleCalculatorInput('0')}>0</button>
                <button onClick={() => handleCalculatorInput('.')}>.</button>
                <button onClick={() => handleCalculatorInput('(')}>(</button>
                <button onClick={() => handleCalculatorInput(')')}>)</button>

                <button 
                  onClick={() => handleCalculatorInput('=')}
                  className="equals-btn"
                >
                  =
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Graphing Panel */}
        {activeTool === "graph" && (
          <div className="graphing-panel">
            <div className="graph-controls">
              <input
                type="text"
                value={graphEquation}
                onChange={(e) => setGraphEquation(e.target.value)}
                placeholder="Enter function (e.g., x^2, sin(x), 2*x+1)"
                className="graph-equation-input"
              />
              <select 
                value={graphType} 
                onChange={(e) => setGraphType(e.target.value)}
              >
                <option value="function">Function</option>
                <option value="parametric">Parametric</option>
                <option value="polar">Polar</option>
              </select>
              <button onClick={renderGraph}>Plot Graph</button>
            </div>
            
            <div className="graph-canvas-container">
              <canvas 
                ref={graphRef}
                width={800}
                height={600}
                className="graph-canvas"
              />
            </div>
          </div>
        )}

        {/* Geometry Panel */}
        {activeTool === "geometry" && (
          <div className="geometry-panel">
            <div className="geometry-tools">
              <button>📐 Draw Line</button>
              <button>⭕ Draw Circle</button>
              <button>△ Draw Triangle</button>
              <button>□ Draw Rectangle</button>
              <button>📏 Measure</button>
              <button>🔄 Transform</button>
            </div>
            <div className="geometry-canvas">
              <canvas ref={canvasRef} />
            </div>
          </div>
        )}

        {/* Equations Panel */}
        {activeTool === "equations" && (
          <div className="equations-panel">
            <div className="equation-solver">
              <h3>Equation Solver</h3>
              <input
                type="text"
                placeholder="Enter equation (e.g., 2x + 5 = 13)"
                className="equation-input"
              />
              <button>Solve</button>
              <div className="solution-display">
                Solution will appear here...
              </div>
            </div>
            
            <div className="matrix-calculator">
              <h3>Matrix Calculator</h3>
              <div className="matrix-input">
                <input type="text" placeholder="1" />
                <input type="text" placeholder="2" />
                <br />
                <input type="text" placeholder="3" />
                <input type="text" placeholder="4" />
              </div>
              <div className="matrix-operations">
                <button>Determinant</button>
                <button>Inverse</button>
                <button>Multiply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MathNotebook;