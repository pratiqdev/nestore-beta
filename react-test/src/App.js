
import { useEffect } from 'react';
import './App.css';
import useStore from './hook.js'
import NST from './store.js'

function App() {
  const store = useStore()
  const val = useStore('num')

  useEffect(()=>{
    console.log('store changed')
  },[store])

  return (
    <div className="App">
      <header className="App-header">
        Nestore hook test
        <p>{JSON.stringify(val)}</p>
        {/* <p>{JSON.stringify(NST)}</p> */}
        <button onClick={() => NST.inc()}>INC</button>
      </header>
    </div>
  );
}

export default App;
