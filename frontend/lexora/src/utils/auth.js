// Temporary fake authentication system
let isAuthenticated = false;

export function login() {
  isAuthenticated = true;
}

export function logout() {
  isAuthenticated = false;
}

export function getAuthStatus() {
  return isAuthenticated;
}
