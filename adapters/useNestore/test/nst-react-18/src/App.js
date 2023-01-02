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
        <p>
          {greeting}
        </p>
      </header>
    </div>
  );
}

export default App;
