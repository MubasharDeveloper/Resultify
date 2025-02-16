import { BrowserRouter, Route, Routes } from "react-router-dom";

// Valid Routes

import RouteScrollToTop from "./helper/RouteScrollToTop";
import BlankPagePage from "./pages/BlankPagePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ErrorPage from "./pages/ErrorPage";
import FaqPage from "./pages/FaqPage";
import CheckIdCard from "./pages/CheckIdCard";
import Profile from "./pages/Profile";
import FormPage from "./pages/FormPage";
import ListPage from "./pages/ListPage";



function App() {
  return (
    <BrowserRouter>
      <RouteScrollToTop />
      <Routes>

        {/* Valid Routes */}

        <Route exact path='/' element={<CheckIdCard />} />
        <Route exact path='/profile' element={<Profile />} />
        <Route exact path='/faq' element={<FaqPage />} />
        <Route exact path='/blank-page' element={<BlankPagePage />} />
        <Route exact path='/sign-in' element={<SignInPage />} />
        <Route exact path='/sign-up' element={<SignUpPage />} />
        <Route exact path='/form' element={<FormPage />} />
        <Route exact path='/list' element={<ListPage />} />

        <Route exact path='*' element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
