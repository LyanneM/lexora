// src/pages/ComplexMathNotebook.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notesService } from "../services/firebaseService";
import "../styles/complex-math-notebook.css";

// Advanced math library using math.js and other JS math libraries
class AdvancedMathEngine {
  constructor() {
    this.variables = new Map();
    this.history = [];
  }

  // Complex number operations
  complex(a, b) {
    return { re: a, im: b, type: 'complex' };
  }

  addComplex(z1, z2) {
    return this.complex(z1.re + z2.re, z1.im + z2.im);
  }

  multiplyComplex(z1, z2) {
    return this.complex(
      z1.re * z2.re - z1.im * z2.im,
      z1.re * z2.im + z1.im * z2.re
    );
  }

  complexToString(z) {
    if (z.im === 0) return z.re.toString();
    if (z.re === 0) return `${z.im}i`;
    return `${z.re} ${z.im > 0 ? '+' : ''} ${z.im}i`;
  }

  // Matrix operations
  createMatrix(rows, cols, data = null) {
    const matrix = {
      rows,
      cols,
      data: data || Array(rows).fill().map(() => Array(cols).fill(0))
    };
    return matrix;
  }

  matrixMultiply(A, B) {
    if (A.cols !== B.rows) throw new Error("Matrix dimensions don't match for multiplication");
    
    const result = this.createMatrix(A.rows, B.cols);
    
    for (let i = 0; i < A.rows; i++) {
      for (let j = 0; j < B.cols; j++) {
        let sum = 0;
        for (let k = 0; k < A.cols; k++) {
          sum += A.data[i][k] * B.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  matrixDeterminant(matrix) {
    if (matrix.rows !== matrix.cols) throw new Error("Matrix must be square");
    
    if (matrix.rows === 2) {
      return matrix.data[0][0] * matrix.data[1][1] - matrix.data[0][1] * matrix.data[1][0];
    }
    
    let det = 0;
    for (let j = 0; j < matrix.cols; j++) {
      const minor = this.getMatrixMinor(matrix, 0, j);
      det += matrix.data[0][j] * Math.pow(-1, j) * this.matrixDeterminant(minor);
    }
    return det;
  }

  getMatrixMinor(matrix, row, col) {
    const minor = this.createMatrix(matrix.rows - 1, matrix.cols - 1);
    let minorRow = 0;
    
    for (let i = 0; i < matrix.rows; i++) {
      if (i === row) continue;
      let minorCol = 0;
      for (let j = 0; j < matrix.cols; j++) {
        if (j === col) continue;
        minor.data[minorRow][minorCol] = matrix.data[i][j];
        minorCol++;
      }
      minorRow++;
    }
    return minor;
  }

  // Calculus operations
  derivative(f, x, h = 1e-5) {
    return (f(x + h) - f(x - h)) / (2 * h);
  }

  integrate(f, a, b, n = 1000) {
    const h = (b - a) / n;
    let sum = (f(a) + f(b)) / 2;
    
    for (let i = 1; i < n; i++) {
      sum += f(a + i * h);
    }
    
    return sum * h;
  }

  // Equation solving
  solveEquation(equation, variable, initialGuess = 0) {
    // Newton-Raphson method
    const f = (x) => {
      const scope = { [variable]: x };
      return this.evaluateExpression(equation, scope);
    };
    
    const fPrime = (x) => this.derivative(f, x);
    
    let x = initialGuess;
    for (let i = 0; i < 100; i++) {
      const fx = f(x);
      const fpx = fPrime(x);
      
      if (Math.abs(fx) < 1e-10) break;
      if (Math.abs(fpx) < 1e-10) break;
      
      x = x - fx / fpx;
    }
    
    return x;
  }

  // Expression evaluation (simplified)
  evaluateExpression(expr, scope = {}) {
    try {
      // Replace variables with their values
      let evaluatedExpr = expr;
      Object.keys(scope).forEach(key => {
        evaluatedExpr = evaluatedExpr.replace(new RegExp(key, 'g'), scope[key]);
      });
      
      // Safe evaluation
      return Function(`"use strict"; return (${evaluatedExpr})`)();
    } catch (error) {
      throw new Error(`Evaluation error: ${error.message}`);
    }
  }

  // Statistical functions
  mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  standardDeviation(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }
}

function ComplexMathNotebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState("Complex Math Notebook");
  const [activeTool, setActiveTool] = useState("calculator");
  const [isSaving, setIsSaving] = useState(false);
  const [mathEngine] = useState(new AdvancedMathEngine());
  
  // Calculator state
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  
  // Matrix state
  const [matrixA, setMatrixA] = useState([[1, 2], [3, 4]]);
  const [matrixB, setMatrixB] = useState([[5, 6], [7, 8]]);
  const [matrixResult, setMatrixResult] = useState(null);
  
  // Calculus state
  const [functionInput, setFunctionInput] = useState("x^2");
  const [calculusResult, setCalculusResult] = useState("");
  const [integrationRange, setIntegrationRange] = useState({ from: 0, to: 1 });
  
  // Complex numbers state
  const [complexA, setComplexA] = useState({ re: 3, im: 2 });
  const [complexB, setComplexB] = useState({ re: 1, im: -4 });
  const [complexResult, setComplexResult] = useState(null);
  
  // Equation solving state
  const [equationInput, setEquationInput] = useState("x^2 - 4");
  const [equationVariable, setEquationVariable] = useState("x");
  const [equationSolution, setEquationSolution] = useState("");

  // Load and save functions
  useEffect(() => {
    if (id && id !== "create") {
      loadNotebook();
    }
  }, [id]);

  const loadNotebook = async () => {
    try {
      const notebookData = await notesService.getNote(id);
      if (notebookData) {
        setTitle(notebookData.title);
        // Could load other state from saved data
      }
    } catch (error) {
      console.error("Error loading notebook:", error);
    }
  };

  const saveNotebook = async () => {
    setIsSaving(true);
    try {
      const notebookData = {
        title,
        type: "complex-math",
        content: JSON.stringify({
          calcInput,
          matrixA,
          matrixB,
          functionInput,
          complexA,
          complexB,
          equationInput
        }),
        updatedAt: new Date(),
        owner: currentUser.uid,
        createdAt: id && id !== "create" ? undefined : new Date()
      };

      if (id && id !== "create") {
        await notesService.updateNote(id, notebookData);
      } else {
        const newId = await notesService.createNote(notebookData);
        navigate(`/notebook/complex-math/${newId}`);
      }
    } catch (error) {
      console.error("Error saving notebook:", error);
    }
    setIsSaving(false);
  };

  // Calculator operations
  const handleCalcInput = (value) => {
    if (value === "=") {
      try {
        const result = mathEngine.evaluateExpression(calcInput
          .replace(/\^/g, '**')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/√/g, 'Math.sqrt')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/tan/g, 'Math.tan')
          .replace(/log/g, 'Math.log10')
          .replace(/ln/g, 'Math.log')
        );
        setCalcResult(result.toString());
      } catch (error) {
        setCalcResult(`Error: ${error.message}`);
      }
    } else if (value === "C") {
      setCalcInput("");
      setCalcResult("");
    } else if (value === "⌫") {
      setCalcInput(prev => prev.slice(0, -1));
    } else {
      setCalcInput(prev => prev + value);
    }
  };

  // Matrix operations
  const performMatrixOperation = (operation) => {
    try {
      const A = mathEngine.createMatrix(matrixA.length, matrixA[0].length, matrixA);
      const B = mathEngine.createMatrix(matrixB.length, matrixB[0].length, matrixB);
      
      let result;
      switch (operation) {
        case 'multiply':
          result = mathEngine.matrixMultiply(A, B);
          break;
        case 'determinantA':
          result = { scalar: mathEngine.matrixDeterminant(A) };
          break;
        case 'determinantB':
          result = { scalar: mathEngine.matrixDeterminant(B) };
          break;
        default:
          throw new Error("Unknown operation");
      }
      
      setMatrixResult(result);
    } catch (error) {
      setMatrixResult({ error: error.message });
    }
  };

  // Calculus operations
  const performCalculusOperation = (operation) => {
    try {
      const f = (x) => mathEngine.evaluateExpression(functionInput
        .replace(/\^/g, '**')
        .replace(/x/g, `(${x})`)
      );
      
      let result;
      switch (operation) {
        case 'derivative':
          const derivativeAt = mathEngine.derivative(f, 1); // at x=1
          result = `f'(1) = ${derivativeAt.toFixed(6)}`;
          break;
        case 'integrate':
          const integral = mathEngine.integrate(f, integrationRange.from, integrationRange.to);
          result = `∫${functionInput} dx from ${integrationRange.from} to ${integrationRange.to} = ${integral.toFixed(6)}`;
          break;
        default:
          throw new Error("Unknown operation");
      }
      
      setCalculusResult(result);
    } catch (error) {
      setCalculusResult(`Error: ${error.message}`);
    }
  };

  // Complex number operations
  const performComplexOperation = (operation) => {
    try {
      const z1 = mathEngine.complex(complexA.re, complexA.im);
      const z2 = mathEngine.complex(complexB.re, complexB.im);
      
      let result;
      switch (operation) {
        case 'add':
          result = mathEngine.addComplex(z1, z2);
          break;
        case 'multiply':
          result = mathEngine.multiplyComplex(z1, z2);
          break;
        default:
          throw new Error("Unknown operation");
      }
      
      setComplexResult(result);
    } catch (error) {
      setComplexResult({ error: error.message });
    }
  };

  // Equation solving
  const solveEquation = () => {
    try {
      const solution = mathEngine.solveEquation(
        equationInput.replace(/\^/g, '**'),
        equationVariable
      );
      setEquationSolution(`x ≈ ${solution.toFixed(6)}`);
    } catch (error) {
      setEquationSolution(`Error: ${error.message}`);
    }
  };

  // Matrix input helpers
  const updateMatrixA = (row, col, value) => {
    const newMatrix = [...matrixA];
    newMatrix[row][col] = parseFloat(value) || 0;
    setMatrixA(newMatrix);
  };

  const updateMatrixB = (row, col, value) => {
    const newMatrix = [...matrixB];
    newMatrix[row][col] = parseFloat(value) || 0;
    setMatrixB(newMatrix);
  };

  const resizeMatrix = (matrix, rows, cols) => {
    const newMatrix = Array(rows).fill().map(() => Array(cols).fill(0));
    for (let i = 0; i < Math.min(rows, matrix.length); i++) {
      for (let j = 0; j < Math.min(cols, matrix[i].length); j++) {
        newMatrix[i][j] = matrix[i][j];
      }
    }
    return newMatrix;
  };

  return (
    <div className="complex-math-notebook">
      {/* Header */}
      <div className="math-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="math-title"
          placeholder="Complex Math Notebook"
        />
        
        <div className="header-actions">
          <button onClick={saveNotebook} disabled={isSaving} className="save-btn">
            {isSaving ? "💾 Saving..." : "💾 Save"}
          </button>
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Tool Navigation */}
      <div className="math-tool-nav">
        <button 
          className={activeTool === "calculator" ? "active" : ""}
          onClick={() => setActiveTool("calculator")}
        >
          🧮 Calculator
        </button>
        <button 
          className={activeTool === "matrices" ? "active" : ""}
          onClick={() => setActiveTool("matrices")}
        >
          📊 Matrices
        </button>
        <button 
          className={activeTool === "calculus" ? "active" : ""}
          onClick={() => setActiveTool("calculus")}
        >
          ∫ Calculus
        </button>
        <button 
          className={activeTool === "complex" ? "active" : ""}
          onClick={() => setActiveTool("complex")}
        >
          ℂ Complex Numbers
        </button>
        <button 
          className={activeTool === "equations" ? "active" : ""}
          onClick={() => setActiveTool("equations")}
        >
          ⚖️ Equations
        </button>
      </div>

      {/* Main Content */}
      <div className="math-content">
        {/* Advanced Calculator */}
        {activeTool === "calculator" && (
          <div className="tool-panel">
            <h3>Advanced Scientific Calculator</h3>
            <div className="calculator">
              <div className="calc-display">
                <div className="calc-input">{calcInput}</div>
                <div className="calc-result">{calcResult}</div>
              </div>
              
              <div className="calc-buttons">
                <div className="calc-scientific">
                  <button onClick={() => handleCalcInput("π")}>π</button>
                  <button onClick={() => handleCalcInput("e")}>e</button>
                  <button onClick={() => handleCalcInput("√(")}>√</button>
                  <button onClick={() => handleCalcInput("^")}>^</button>
                  <button onClick={() => handleCalcInput("(")}>(</button>
                  <button onClick={() => handleCalcInput(")")}>)</button>
                  <button onClick={() => handleCalcInput("sin(")}>sin</button>
                  <button onClick={() => handleCalcInput("cos(")}>cos</button>
                  <button onClick={() => handleCalcInput("tan(")}>tan</button>
                  <button onClick={() => handleCalcInput("log(")}>log</button>
                  <button onClick={() => handleCalcInput("ln(")}>ln</button>
                </div>
                
                <div className="calc-basic">
                  <button onClick={() => handleCalcInput("C")}>C</button>
                  <button onClick={() => handleCalcInput("⌫")}>⌫</button>
                  <button onClick={() => handleCalcInput("%")}>%</button>
                  <button onClick={() => handleCalcInput("/")}>/</button>

                  <button onClick={() => handleCalcInput("7")}>7</button>
                  <button onClick={() => handleCalcInput("8")}>8</button>
                  <button onClick={() => handleCalcInput("9")}>9</button>
                  <button onClick={() => handleCalcInput("*")}>×</button>

                  <button onClick={() => handleCalcInput("4")}>4</button>
                  <button onClick={() => handleCalcInput("5")}>5</button>
                  <button onClick={() => handleCalcInput("6")}>6</button>
                  <button onClick={() => handleCalcInput("-")}>-</button>

                  <button onClick={() => handleCalcInput("1")}>1</button>
                  <button onClick={() => handleCalcInput("2")}>2</button>
                  <button onClick={() => handleCalcInput("3")}>3</button>
                  <button onClick={() => handleCalcInput("+")}>+</button>

                  <button onClick={() => handleCalcInput("0")}>0</button>
                  <button onClick={() => handleCalcInput(".")}>.</button>
                  <button onClick={() => handleCalcInput("=")} className="equals">=</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matrix Operations */}
        {activeTool === "matrices" && (
          <div className="tool-panel">
            <h3>Matrix Operations</h3>
            <div className="matrix-operations">
              <div className="matrix-inputs">
                <div className="matrix-container">
                  <h4>Matrix A</h4>
                  <div className="matrix-grid">
                    {matrixA.map((row, i) => (
                      <div key={i} className="matrix-row">
                        {row.map((cell, j) => (
                          <input
                            key={j}
                            type="number"
                            value={cell}
                            onChange={(e) => updateMatrixA(i, j, e.target.value)}
                            className="matrix-cell"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="matrix-container">
                  <h4>Matrix B</h4>
                  <div className="matrix-grid">
                    {matrixB.map((row, i) => (
                      <div key={i} className="matrix-row">
                        {row.map((cell, j) => (
                          <input
                            key={j}
                            type="number"
                            value={cell}
                            onChange={(e) => updateMatrixB(i, j, e.target.value)}
                            className="matrix-cell"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="matrix-controls">
                <button onClick={() => performMatrixOperation('multiply')}>
                  Multiply A × B
                </button>
                <button onClick={() => performMatrixOperation('determinantA')}>
                  det(A)
                </button>
                <button onClick={() => performMatrixOperation('determinantB')}>
                  det(B)
                </button>
              </div>
              
              {matrixResult && (
                <div className="matrix-result">
                  <h4>Result:</h4>
                  {matrixResult.error ? (
                    <div className="error">{matrixResult.error}</div>
                  ) : matrixResult.scalar ? (
                    <div>Determinant: {matrixResult.scalar}</div>
                  ) : (
                    <div className="matrix-grid">
                      {matrixResult.data.map((row, i) => (
                        <div key={i} className="matrix-row">
                          {row.map((cell, j) => (
                            <div key={j} className="matrix-cell result">
                              {cell.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calculus */}
        {activeTool === "calculus" && (
          <div className="tool-panel">
            <h3>Calculus Operations</h3>
            <div className="calculus-operations">
              <div className="function-input">
                <label>Function f(x):</label>
                <input
                  type="text"
                  value={functionInput}
                  onChange={(e) => setFunctionInput(e.target.value)}
                  placeholder="x^2, sin(x), exp(x), etc."
                />
              </div>
              
              <div className="calculus-controls">
                <button onClick={() => performCalculusOperation('derivative')}>
                  Find Derivative at x=1
                </button>
                
                <div className="integration-range">
                  <label>Integration Range:</label>
                  <input
                    type="number"
                    value={integrationRange.from}
                    onChange={(e) => setIntegrationRange(prev => ({
                      ...prev,
                      from: parseFloat(e.target.value)
                    }))}
                  />
                  <span> to </span>
                  <input
                    type="number"
                    value={integrationRange.to}
                    onChange={(e) => setIntegrationRange(prev => ({
                      ...prev,
                      to: parseFloat(e.target.value)
                    }))}
                  />
                  <button onClick={() => performCalculusOperation('integrate')}>
                    Integrate
                  </button>
                </div>
              </div>
              
              {calculusResult && (
                <div className="calculus-result">
                  <h4>Result:</h4>
                  <div>{calculusResult}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complex Numbers */}
        {activeTool === "complex" && (
          <div className="tool-panel">
            <h3>Complex Number Operations</h3>
            <div className="complex-operations">
              <div className="complex-inputs">
                <div className="complex-number">
                  <h4>Complex Number A</h4>
                  <div className="complex-input">
                    <input
                      type="number"
                      value={complexA.re}
                      onChange={(e) => setComplexA(prev => ({
                        ...prev,
                        re: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="Real"
                    />
                    <span> + </span>
                    <input
                      type="number"
                      value={complexA.im}
                      onChange={(e) => setComplexA(prev => ({
                        ...prev,
                        im: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="Imaginary"
                    />
                    <span>i</span>
                  </div>
                </div>
                
                <div className="complex-number">
                  <h4>Complex Number B</h4>
                  <div className="complex-input">
                    <input
                      type="number"
                      value={complexB.re}
                      onChange={(e) => setComplexB(prev => ({
                        ...prev,
                        re: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="Real"
                    />
                    <span> + </span>
                    <input
                      type="number"
                      value={complexB.im}
                      onChange={(e) => setComplexB(prev => ({
                        ...prev,
                        im: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="Imaginary"
                    />
                    <span>i</span>
                  </div>
                </div>
              </div>
              
              <div className="complex-controls">
                <button onClick={() => performComplexOperation('add')}>
                  A + B
                </button>
                <button onClick={() => performComplexOperation('multiply')}>
                  A × B
                </button>
              </div>
              
              {complexResult && (
                <div className="complex-result">
                  <h4>Result:</h4>
                  {complexResult.error ? (
                    <div className="error">{complexResult.error}</div>
                  ) : (
                    <div>
                      {mathEngine.complexToString(complexResult)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equation Solving */}
        {activeTool === "equations" && (
          <div className="tool-panel">
            <h3>Equation Solver</h3>
            <div className="equation-solver">
              <div className="equation-input">
                <label>Equation:</label>
                <input
                  type="text"
                  value={equationInput}
                  onChange={(e) => setEquationInput(e.target.value)}
                  placeholder="x^2 - 4, exp(x) - 2, etc."
                />
              </div>
              
              <div className="equation-controls">
                <button onClick={solveEquation}>
                  Solve Equation
                </button>
              </div>
              
              {equationSolution && (
                <div className="equation-result">
                  <h4>Solution:</h4>
                  <div>{equationSolution}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplexMathNotebook;