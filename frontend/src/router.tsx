import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import NewPost from "./pages/NewPost";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RequireAuth from "./components/RequireAuth";
import Navbar from "./components/Navbar";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Shell><Home /></Shell>,
  },
  {
    path: "/posts/:id",
    element: <Shell><PostDetail /></Shell>,
  },
  {
    element: <Shell><RequireAuth /></Shell>,
    children: [
      { path: "/new", element: <NewPost /> },
    ],
  },
  {
    path: "/login",
    element: <Shell><Login /></Shell>,
  },
  {
    path: "/signup",
    element: <Shell><Signup /></Shell>,
  },
]);
