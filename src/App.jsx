
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import Homepage from './Homepage'
import Login from './Login'
import Contact from './Contact'
import AboutUs from './AboutUs'
import DynamicTopics from './DynamicTopics'
import ThinkAnalyse from './ThinkAnalyse';


function App() {
  
  
  return (

    
    <BrowserRouter>
    <nav>
     <Link to="/">Homepage</Link> |
     <Link to="/login">Login</Link> |
    <Link to="/thinkanalyse">Think Analyse</Link> |
    <Link to="/contact">Contact</Link> |
    <Link to="/aboutus">About Us</Link> |
    </nav>

    <Routes>
    <Route path="/" element={<Homepage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/thinkanalyse" element={<ThinkAnalyse />}>
    <Route path="dynamictopics" element={<DynamicTopics />} />
    </Route>
    <Route path="/contact" element={<Contact />} />
    <Route path="/aboutus" element={<AboutUs />} />
    </Routes>
    </BrowserRouter>
       
  );
};

export default App;
