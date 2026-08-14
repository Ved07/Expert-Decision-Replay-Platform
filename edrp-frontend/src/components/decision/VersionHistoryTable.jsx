function VersionHistoryTable({ versions }) {

    return (

        <div className="table-container">

            <table className="history-table">

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Version</th>

                        <th>Title</th>

                        <th>Updated By</th>

                        <th>Updated Date</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        versions.length > 0 ? (

                            versions.map((item) => (

                                <tr key={item.id}>

                                    <td>

                                        {item.id}

                                    </td>

                                    <td>

                                        <strong>

                                            v{item.version_number}

                                        </strong>

                                    </td>

                                    <td>

                                        {item.title}

                                    </td>

                                    <td>

                                        {item.updated_by}

                                    </td>

                                    <td>

                                        {

                                            item.updated_at
                                                ? new Date(
                                                      item.updated_at
                                                  ).toLocaleString()
                                                : "-"

                                        }

                                    </td>

                                    <td>

                                        <span
                                            className={`status ${item.status}`}
                                        >

                                            {item.status}

                                        </span>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="no-data"
                                >

                                    No Version History Found

                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}

export default VersionHistoryTable;