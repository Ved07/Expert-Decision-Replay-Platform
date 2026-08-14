function KnowledgeTable({ knowledge }) {

    return (

        <div className="table-container">

            <table className="knowledge-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Content</th>
                        <th>Source</th>
                        <th>Added At</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        knowledge.length > 0 ?

                        knowledge.map((item) => (

                            <tr key={item.id}>

                                <td>{item.id}</td>

                                <td>

                                    {item.content}

                                </td>

                                <td>

                                    {item.source || "-"}

                                </td>

                                <td>

                                    {

                                        new Date(
                                            item.added_at
                                        ).toLocaleString()

                                    }

                                </td>

                            </tr>

                        ))

                        :

                        <tr>

                            <td
                                colSpan="4"
                                className="no-data"
                            >
                                No Knowledge Found
                            </td>

                        </tr>

                    }

                </tbody>

            </table>

        </div>

    );

}

export default KnowledgeTable;