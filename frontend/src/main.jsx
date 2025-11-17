import "./index.css"
import React from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./routes/App"
import Home from "./routes/Home"
import Login from "./routes/Login"
import Register from "./routes/Register"
import StudentDashboard from "./routes/StudentDashboard"
import PuzzleSolving from "./routes/PuzzleSolving"
import InstructorDashboard from "./routes/InstructorDashboard"
import InstructorPuzzles from "./routes/InstructorPuzzles"
import InstructorAnalytics from "./routes/InstructorAnalytics"
import LLMPlayground from "./routes/LLMPlayground"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/student/dashboard", element: <StudentDashboard /> },
      { path: "/student/puzzle/:id", element: <PuzzleSolving /> },
      { path: "/instructor/dashboard", element: <InstructorDashboard /> },
      { path: "/instructor/puzzles", element: <InstructorPuzzles /> },
      { path: "/instructor/analytics", element: <InstructorAnalytics /> }
      ,{ path: "/llm", element: <LLMPlayground /> }
    ]
  }
])

const root = createRoot(document.getElementById("root"))
root.render(<RouterProvider router={router} />)