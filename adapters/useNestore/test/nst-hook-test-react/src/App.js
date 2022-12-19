import { useEffect, useState } from 'react'
import './App.css';

import useNestore from './store/store';

// function App() {

//   const [store, setStore] = useStore()
//   const [greeting, setGreeting] = useStore('greeting')
//   const [nonEx, setNonEx] = useStore('doesnt-exist-in-store-yet')

//   return (
//     <div className="App">
//       <header className="App-header">
        
//         <b>Store:</b>
//         <pre>{JSON.stringify(store)}</pre>
//         <button onClick={() => setStore({ goodbye: "old friend" })}>Set store</button>
        
//         <b>Greeting:</b>
//         <pre>{greeting}</pre>
//         <button onClick={() => setGreeting("Ayo, bip bop")}>Set store</button>
        

//         <b>Non Existent:</b>
//         <pre>{nonEx}</pre>
//         <button onClick={() => setNonEx("I exist!")}>Set store</button>
        
//       </header>
//     </div>
//   );
// }

// export default App;


const Hello = () => {
  const [value, setValue] = useNestore('hello')

  
  return(
    <div className='nestore-container'>
      <p>hello: {value}</p>
      <button onClick={()=>setValue('friends')}>friends</button>
      <button onClick={()=>setValue('people')}>people</button>
      <button onClick={()=>setValue('yall')}>yall</button>
    </div>
  )

}

const Count = () => {
  const [value, setValue] = useNestore('count')
  
  return(
    <div className='nestore-container'>
      <p>count: {value}</p>
      <button onClick={()=>setValue(0)}>0</button>
      <button onClick={()=>setValue(1)}>1</button>
      <button onClick={()=>setValue(2)}>2</button>
    </div>
  )

}

const Time = () => {
  const [value, setValue] = useNestore('time')
  
  return(
    <div className='nestore-container'>
      <p>time: {value}</p>
      <button onClick={()=>setValue(Date.now())}>now</button>
    </div>
  )

}

const Store = () => {
  const [value, setValue] = useNestore()

  useEffect(()=>{
    console.log('Store component loaded store:', value)
  }, [value])
  
  return(
    <div className='nestore-container'>
      <pre>{JSON.stringify(value, null, 2)}</pre>
      <button onClick={()=>setValue({hello: 'World!', count: 0, time: Date.now()})}>reset</button>
    </div>
  )

}

const PersonName = () => {
  const [value, setValue] = useNestore('person.name')
  //@ts-ignore
  const func = useNestore('setName')
  const login = useNestore('login')
  
  return(
    <div className='nestore-container'>
      <p>person.name: {value}</p>
      <button onClick={()=>setValue('Alice')}>Alice</button>
      <button onClick={()=>setValue('Bob')}>Bob</button>
      <button onClick={()=>setValue('Charles')}>Charles</button>
      <button onClick={()=>func('whaaat')}>whaaat</button>
      <button onClick={()=>login()}>data</button>
    </div>
  )

}

const PersonAge = () => {
  const [value, setValue] = useNestore('person.age')
  
  return(
    <div className='nestore-container'>
      <p>person.age: {value}</p>
      <button onClick={()=>setValue(30)}>30</button>
      <button onClick={()=>setValue(40)}>40</button>
      <button onClick={()=>setValue(50)}>50</button>
    </div>
  )

}


function App() {

  return (
    <div className="App">
      <header className="App-header">
        <h4>Nestore React Hook Test</h4>
        {/* <button onClick={() => window?.localStorage?.removeItem('NST_PERSIST_KEY')}>Clear Storage</button> */}
        {/* <button onClick={() => adptr.load()}>Load Storage</button> */}
        {/* <pre>??{JSON.stringify(adptr)}</pre> */}
        <Hello />
        {/* <Count />
        <Time />
        <PersonName />
        <PersonAge /> */}
        <Store />
      </header>
    </div>
  );
}

export default App;
