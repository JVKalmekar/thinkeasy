import { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import DynamicTopics from './DynamicTopics'
import TopicsUpdate from './TopicsUpdate'
import './App.css'



function ThinkAnalyse() {
       
      return (
        <div>
        <nav>
          <Link to="dynamictopics">Dynamic Topics</Link> |
          <Link to="topicsupdate">Topics Update</Link> |
          <Link to="taskscrutiny">Task Scrutiny</Link>
          </nav>
         <Outlet />
        </div>
                         
      )

}

export default ThinkAnalyse
