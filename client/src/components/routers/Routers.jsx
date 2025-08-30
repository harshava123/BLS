import React from 'react'
import {  Routes, Route } from 'react-router-dom'
import Agent from '../pages/Agent'
import Login from '../pages/Login'
import Admin from '../pages/Admin'


function Routers() {
  return (
    <Routes>
        
            <Route path='/' element={<Login/>}/>
            <Route path='/agent' element={<Agent/>}/>
            <Route path='/admin' element={<Admin/>}/>
        
    </Routes>
  )
}

export default Routers