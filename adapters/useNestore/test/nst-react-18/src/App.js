import logo from './logo.svg';
import './App.css';

import useStore from './store';
// import createStore from 'use-nestore'
// const useStore = createStore({
//   greeting: 'Hello, World!'
// })

function App() {
  const [greeting, setGreeting] = useStore('greeting')




  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {/* <p>{greeting}</p> */}
        <p>Greeting: "{greeting ? greeting.toString() : 'undefined'}"</p>
        <button onClick={() => setGreeting('why tho')}>Set Greeting</button>
      </header>
    </div>
  );
}

export default App;
