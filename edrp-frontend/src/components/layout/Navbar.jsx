
import { Link } from "react-router-dom";
import "../../styles/navbar.css";
function Navbar({ user }) {

    return (

        <header className="navbar">

            <div>

                <input 
                    type="text"
                    placeholder="Search decisions..."
                />

            </div>


            <div className="profile">

                <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </span>


                <span>
                    {user.name}
                </span>


                <span>
                    ({user.role})
                </span>

            </div>


        </header>

    );

}

export default Navbar;