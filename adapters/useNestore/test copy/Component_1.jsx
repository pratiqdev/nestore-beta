import React from 'react'
import useNestore from '../index.js'

const Component = (props) => {
    const initialStore = props?.initialStore ?? {}
    const options = props?.options ?? undefined

    const NST = useNestore(initialStore, options)

    return(
        <>
            <h2>useNestore</h2>
            <pre>{JSON.stringify(NST)}</pre>
        </>
    )

}

export default Component