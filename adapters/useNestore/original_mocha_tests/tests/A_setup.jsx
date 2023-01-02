import {
    Nestore,
    debug,
    __dir,
    heading,
    render,
    screen,
} from '../utils.jsx'

// import userEvent from '@testing-library/user-event'
import {describe, expect, test} from '@jest/globals';   

import useNestore from '../../index.js'
import persistAdapter from '../../../persistAdapter/index.js'
import mongoAdapter from '../../../mongoAdapter/index.js'

import Component from '../Component_1.jsx'


describe.only(heading('I | useNestore Hook'), function(){
    this.timeout(30_000)

    render(<Component />)


    // const present = screen.getByText(/present/i)
    // const input = screen.getByLabelText(/new value/i)
    // const past = screen.getByText(/past/i)
    // const future = screen.getByText(/future/i)
    // const submit = screen.getByText(/submit/i)
    // const undo = screen.getByText(/undo/i)
    // const redo = screen.getByText(/redo/i)
  
    // assert initial state
    // expect(undo).toBeDisabled()
    // expect(redo).toBeDisabled()
    // expect(past).toHaveTextContent(`Past:`)
    // expect(present).toHaveTextContent(`Present: one`)
    // expect(future).toHaveTextContent(`Future:`)
  
    // add second value
    input.value = 'two'
    // userEvent.click(submit)

        

})
