import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { NewPost } from "./pages/NewPost";
import { PostDetail } from "./pages/PostDetail";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewPost />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
