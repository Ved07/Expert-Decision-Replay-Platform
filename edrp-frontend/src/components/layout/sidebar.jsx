import { Link } from "react-router-dom";
import "../../styles/sidebar.css";

function Sidebar({ role }) {
    console.log("SIDEBAR LOADED");
    console.log("ROLE:", role);
    const isAdmin = role === "Administrator";
    const isManager = role === "Manager";
    const isEmployee = role === "Employee";

    return (

        <aside className="sidebar">

            <div className="sidebar-logo">

                <h2>EDRP</h2>

                <p>Decision Platform</p>

            </div>

            <nav>

                <ul>

                    {/* Common */}

                    <li>
                        <Link to="/dashboard">
                            Dashboard
                        </Link>
                    </li>

                    {/* Employee */}

                    {isEmployee && (
                        <>
                            <li>
                                <Link to="/decisions">
                                    My Decisions
                                </Link>
                            </li>

                            <li>
                                <Link to="/profile">
                                    My Profile
                                </Link>
                            </li>
                        </>
                    )}

                    {/* Manager */}

                    {isManager && (
                        <>
                            <li>
                                <Link to="/decisions">
                                    Decision Management
                                </Link>
                            </li>

                            <li>
                                <Link to="/teams">
                                    Teams
                                </Link>
                            </li>

                            <li>
                                <Link to="/reports">
                                    Reports
                                </Link>
                            </li>
                        </>
                    )}

                    {/* Administrator */}

                    {isAdmin && (
                        <>
                            <li>
                                <Link to="/decisions">
                                    Decision Management
                                </Link>
                            </li>

                            <li>
                                <Link to="/users">
                                    Users
                                </Link>
                            </li>

                            <li>
                                <Link to="/teams">
                                    Teams
                                </Link>
                            </li>

                            <li>
                                <Link to="/categories">
                                    Categories
                                </Link>
                            </li>
                            

                            <li>
                                <Link to="/reports">
                                    Reports
                                </Link>
                            </li>
                        </>
                    )}
                    
                   
                    

                </ul>

            </nav>

        </aside>

    );
}

export default Sidebar;