# backend/services/math_notebook.py
import sympy as sp
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
from typing import Dict, Any, List

class MathNotebookEngine:
    def __init__(self):
        self.variables = {}
        self.history = []
        self.setup_environment()
    
    def setup_environment(self):
        """Setup the mathematical environment with common imports"""
        # Common mathematical symbols
        self.x, self.y, self.z = sp.symbols('x y z')
        
        # Initialize with common functions
        self.variables.update({
            'pi': np.pi,
            'e': np.e,
            'sin': np.sin,
            'cos': np.cos,
            'tan': np.tan,
            'log': np.log,
            'log10': np.log10,
            'sqrt': np.sqrt,
            'exp': np.exp,
            'abs': abs,
            'x': self.x,
            'y': self.y,
            'z': self.z
        })
    
    def execute_cell(self, code: str) -> Dict[str, Any]:
        """Execute a math notebook cell"""
        try:
            # Check for special commands
            if code.strip().startswith('%plot'):
                return self.handle_plot_command(code)
            elif code.strip().startswith('%solve'):
                return self.handle_solve_command(code)
            elif code.strip().startswith('%calc'):
                return self.handle_calc_command(code)
            
            # Regular Python execution with math context
            local_vars = self.variables.copy()
            global_vars = {
                '__builtins__': None,
                'print': self._captured_print,
                'sp': sp,
                'np': np,
                'plt': plt
            }
            
            # Capture output
            output_lines = []
            
            def custom_print(*args, **kwargs):
                output_lines.append(' '.join(str(arg) for arg in args))
            
            global_vars['print'] = custom_print
            
            try:
                # Execute the code
                exec(code, global_vars, local_vars)
                
                # Update variables
                self.variables.update(local_vars)
                
                # Remove built-in and module variables
                for key in ['__builtins__', 'sp', 'np', 'plt', 'print']:
                    self.variables.pop(key, None)
                
                output = '\n'.join(output_lines) if output_lines else "Code executed successfully"
                
                return {
                    "type": "python_execution",
                    "text_output": output,
                    "variables": {k: str(v) for k, v in self.variables.items() 
                                if not k.startswith('_') and k not in ['x', 'y', 'z']}
                }
                
            except Exception as e:
                return {
                    "type": "error",
                    "error": f"Execution error: {str(e)}"
                }
                
        except Exception as e:
            return {
                "type": "error", 
                "error": f"Cell execution error: {str(e)}"
            }
    
    def handle_plot_command(self, code: str) -> Dict[str, Any]:
        """Handle plot commands"""
        try:
            # Extract function from %plot command
            function_str = code.replace('%plot', '').strip()
            
            if not function_str:
                return {"type": "error", "error": "No function provided for plotting"}
            
            # Generate plot
            x_vals = np.linspace(-10, 10, 1000)
            y_vals = []
            
            for x_val in x_vals:
                try:
                    # Safe evaluation
                    y_val = eval(function_str, {"x": x_val, "__builtins__": None}, self.variables)
                    y_vals.append(y_val)
                except:
                    y_vals.append(np.nan)
            
            # Create plot
            plt.figure(figsize=(10, 6), facecolor='#1e1e1e')
            ax = plt.gca()
            ax.set_facecolor('#1e1e1e')
            
            # Plot grid and axes
            ax.grid(True, alpha=0.3, color='#3e3e42')
            ax.axhline(y=0, color='#007acc', linewidth=2)
            ax.axvline(x=0, color='#007acc', linewidth=2)
            
            # Plot function
            ax.plot(x_vals, y_vals, color='#ff6b6b', linewidth=2, label=f'$y = {function_str}$')
            ax.legend(facecolor='#2d2d30', edgecolor='none', labelcolor='white')
            
            # Style
            ax.tick_params(colors='white')
            for spine in ax.spines.values():
                spine.set_color('#007acc')
            
            # Save to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight', 
                       facecolor='#1e1e1e', edgecolor='none')
            buffer.seek(0)
            
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return {
                "type": "plot",
                "plot_data": image_base64,
                "function": function_str
            }
            
        except Exception as e:
            return {"type": "error", "error": f"Plot error: {str(e)}"}
    
    def handle_solve_command(self, code: str) -> Dict[str, Any]:
        """Handle equation solving"""
        try:
            equation_str = code.replace('%solve', '').strip()
            
            if '=' in equation_str:
                lhs, rhs = equation_str.split('=', 1)
                equation = sp.Eq(sp.sympify(lhs), sp.sympify(rhs))
            else:
                equation = sp.sympify(equation_str)
            
            solutions = sp.solve(equation, self.x)
            
            return {
                "type": "equation_solutions",
                "solutions": [str(sol) for sol in solutions],
                "latex_solutions": [sp.latex(sol) for sol in solutions],
                "equation": equation_str
            }
            
        except Exception as e:
            return {"type": "error", "error": f"Solve error: {str(e)}"}
    
    def handle_calc_command(self, code: str) -> Dict[str, Any]:
        """Handle mathematical calculations"""
        try:
            expr_str = code.replace('%calc', '').strip()
            expression = sp.sympify(expr_str)
            
            return {
                "type": "expression_evaluation",
                "result": str(expression),
                "latex_result": sp.latex(expression),
                "evaluated": str(expression.evalf()),
                "expression": expr_str
            }
            
        except Exception as e:
            return {"type": "error", "error": f"Calculation error: {str(e)}"}
    
    def _captured_print(self, *args, **kwargs):
        """Custom print function to capture output"""
        # This will be replaced during execution
        pass
    
    def get_variables(self) -> Dict[str, str]:
        """Get current variables"""
        return {k: str(v) for k, v in self.variables.items() 
                if not k.startswith('_') and k not in ['x', 'y', 'z']}
    
    def clear_session(self):
        """Clear the current session"""
        self.variables.clear()
        self.setup_environment()
        self.history.clear()