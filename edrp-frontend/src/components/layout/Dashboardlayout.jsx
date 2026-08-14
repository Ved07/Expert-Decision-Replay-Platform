import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function DashboardLayout({ user, children }) {
   
    if (!user) {
        return <h2>Loading...</h2>;
    }

    return (

        <div className="layout">

            <Sidebar role={user.role} />

            <div className="main-content">

                <Navbar user={user} />

                <main className="page-content">

                    {children}

                </main>

            </div>

        </div>

    );
}

export default DashboardLayout;