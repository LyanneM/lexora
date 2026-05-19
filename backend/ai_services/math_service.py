# backend/ai_services/math_service.py
import sympy as sp
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
from typing import Dict, Any, List

class MathService:
    def __init__(self):
        self.x = sp.Symbol('x')
        self.y = sp.Symbol('y')
        self.z = sp.Symbol('z')
    
    def evaluate_expression(self, expression: str) -> Dict[str, Any]:
        """Evaluate mathematical expression"""
        try:
            # Convert common notations
            expr = expression.replace('^', '**').replace('π', 'pi')
            sympy_expr = sp.sympify(expr)
            
            return {
                "success": True,
                "result": str(sympy_expr),
                "evaluated": float(sympy_expr.evalf()) if sympy_expr.is_number else str(sympy_expr),
                "latex": sp.latex(sympy_expr),
                "simplified": sp.latex(sp.simplify(sympy_expr))
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def solve_equation(self, equation: str) -> Dict[str, Any]:
        """Solve equations"""
        try:
            if '=' in equation:
                lhs, rhs = equation.split('=', 1)
                sympy_eq = sp.Eq(sp.sympify(lhs), sp.sympify(rhs))
            else:
                sympy_eq = sp.sympify(equation)
            
            solutions = sp.solve(sympy_eq, self.x)
            
            return {
                "success": True,
                "solutions": [str(sol) for sol in solutions],
                "latex_solutions": [sp.latex(sol) for sol in solutions],
                "numeric_solutions": [float(sol.evalf()) if sol.is_number else str(sol) for sol in solutions]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def plot_function(self, function: str, x_range: List[float] = [-10, 10]) -> Dict[str, Any]:
        """Plot mathematical functions"""
        try:
            x_vals = np.linspace(x_range[0], x_range[1], 1000)
            
            # Create plot
            plt.figure(figsize=(10, 6), facecolor='#1e1e1e')
            ax = plt.gca()
            ax.set_facecolor('#1e1e1e')
            
            # Plot grid and axes
            ax.grid(True, alpha=0.3, color='#3e3e42')
            ax.axhline(y=0, color='#007acc', linewidth=2)
            ax.axvline(x=0, color='#007acc', linewidth=2)
            
            # Evaluate function
            y_vals = []
            for x_val in x_vals:
                try:
                    safe_function = function.replace('^', '**')
                    y_val = eval(safe_function, {"x": x_val, "__builtins__": None}, 
                               {"sin": np.sin, "cos": np.cos, "tan": np.tan,
                                "exp": np.exp, "log": np.log, "sqrt": np.sqrt,
                                "pi": np.pi, "e": np.e})
                    y_vals.append(y_val)
                except:
                    y_vals.append(np.nan)
            
            # Plot
            ax.plot(x_vals, y_vals, color='#ff6b6b', linewidth=2, label=f'$y = {function}$')
            ax.legend(facecolor='#2d2d30', edgecolor='none', labelcolor='white')
            
            # Style the plot
            ax.tick_params(colors='white')
            ax.spines['bottom'].set_color('#007acc')
            ax.spines['left'].set_color('#007acc')
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            
            # Save to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight', 
                       facecolor='#1e1e1e', edgecolor='none')
            buffer.seek(0)
            
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return {
                "success": True,
                "plot_data": image_base64,
                "format": "png"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def matrix_operations(self, matrix: List[List], operation: str, matrix2: List[List] = None) -> Dict[str, Any]:
        """Perform matrix operations"""
        try:
            A = np.array(matrix, dtype=float)
            
            if operation == "determinant":
                if A.shape[0] != A.shape[1]:
                    return {"success": False, "error": "Matrix must be square"}
                det = np.linalg.det(A)
                return {"success": True, "result": det, "latex": f"{det:.4f}"}
            
            elif operation == "inverse":
                if A.shape[0] != A.shape[1]:
                    return {"success": False, "error": "Matrix must be square"}
                try:
                    inv = np.linalg.inv(A)
                    return {"success": True, "result": inv.tolist(), "latex": sp.latex(sp.Matrix(inv))}
                except:
                    return {"success": False, "error": "Matrix is singular"}
            
            elif operation == "multiply" and matrix2 is not None:
                B = np.array(matrix2, dtype=float)
                if A.shape[1] != B.shape[0]:
                    return {"success": False, "error": "Matrix dimensions don't match for multiplication"}
                result = np.dot(A, B)
                return {"success": True, "result": result.tolist(), "latex": sp.latex(sp.Matrix(result))}
            
            elif operation == "transpose":
                result = A.T
                return {"success": True, "result": result.tolist(), "latex": sp.latex(sp.Matrix(result))}
            
            else:
                return {"success": False, "error": f"Unknown operation: {operation}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global instance
math_service = MathService()