export function setUserSession(name: string, role: string) {
  sessionStorage.setItem("name", name);
  sessionStorage.setItem("role", role);
}

export function getUserSession() {
  return {
    name: sessionStorage.getItem("name"),
    role: sessionStorage.getItem("role"),
  };
}

export function clearUserSession() {
  sessionStorage.removeItem("name");
  sessionStorage.removeItem("role");
}
