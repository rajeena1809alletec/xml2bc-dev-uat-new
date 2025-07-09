import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import GetAccessToken from './auth/authTokenAPI'
import XMLDataConverter from './components/XMLDataConverter/XMLDataConverter'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="outerdiv">
        <XMLDataConverter/>
      </div>
    </>
  )
}

export default App
