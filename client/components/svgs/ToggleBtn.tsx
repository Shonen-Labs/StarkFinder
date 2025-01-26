interface ToggleBtnProps{
    mode: string
}

const ToggleBtn = ({mode}: ToggleBtnProps)=> {
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.75" y="5.75" width="18.5" height="13.5" rx="6.75" stroke="#131313" stroke-opacity="0.4" stroke-width="1.5"/>
    <circle cx="9.5" cy="12.5" r="4.5" fill="#131313" fill-opacity="0.4"/>
    </svg>
    
}

export default ToggleBtn