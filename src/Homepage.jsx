import { useNavigate } from 'react-router-dom'

export default function Homepage() {
    const navigate = useNavigate();
    const goToContact = () => {

    }
    return (
        <div>
        <h1>Welcomes ! Home page will be detailed soon here.</h1>
        <p>The HCCO : Kalmekar Brother's Enterprizes.</p>
        <button onClick={goToContact}>Go To Contact</button>
        </div>
    )
}