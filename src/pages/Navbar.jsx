import React from 'react'
import { NavLink } from 'react-router-dom'

const navLinkStyles = ({ isActive }) => ({


  // color: isActive ? 'green' : 'black',
  // fontWeight: isActive ? 'bold' : 'normal',
  backgroundColor: isActive ? '#bfdbfe' : 'transparent',
  // padding: '5px 10px'
})

export default function Navbar() {
  return (
    <nav className="border-gray-100 border-b-1 " aria-label="Main navigation">
      <div className="flex justify-between p-2 items-center text-black">
        <div className="logo font-bold text-3xl">ConnectUp</div>

        <ul className="flex text-xl gap-4">
          <NavLink to="/profile" style={navLinkStyles} className="p-1 focus:bg-blue-200 font-semibold border-1 border-gray-200 text-sm rounded-md hover:bg-gray-200" end>
            Profile
          </NavLink>

          <NavLink to="/alert" style={navLinkStyles} className="p-1 focus:bg-blue-200 font-semibold text-sm border-1 border-gray-200 rounded-md hover:bg-gray-200">
            Alert
          </NavLink>

          <NavLink to="/setting" style={navLinkStyles} className="p-1 focus:bg-blue-200 font-semibold border-1 border-gray-200 text-sm rounded-md hover:bg-gray-200 ">
            Setting
          </NavLink>
        </ul>
      </div>
    </nav>
  )
}