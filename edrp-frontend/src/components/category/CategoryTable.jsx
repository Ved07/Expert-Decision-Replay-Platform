import { Link } from "react-router-dom";

function CategoryTable({ categories }) {

    return (

        <div className="table-container">

            <table className="category-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Category Name</th>
                        <th>Description</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        categories.length > 0 ? (

                            categories.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>

                                        <strong>
                                            {item.name}
                                        </strong>

                                    </td>

                                    <td>
                                        {item.description}
                                    </td>

                                    <td>

                                        <Link
                                        to={`/categories/${item.id}`}
                                        className="view-btn"
                                    >
                                        View
                                    </Link>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="4"
                                    className="no-data"
                                >
                                    No Categories Found
                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default CategoryTable;