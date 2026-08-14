import api from "../../services/api";

function AttachmentTable({ attachments, onDeleted }) {

    const handleDownload = (id) => {

        window.open(
            `http://127.0.0.1:8000/attachments/${id}`,
            "_blank"
        );

    };

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this attachment?"
        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/attachments/${id}`);

            alert("Attachment deleted successfully.");

            if (onDeleted) {
                onDeleted();
            }

        } catch (error) {

            console.error("Delete Error:", error);

            alert("Failed to delete attachment.");

        }

    };

    return (

        <div className="table-container">

            <table className="attachment-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>File Name</th>
                        <th>File Type</th>
                        <th>Uploaded At</th>
                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        attachments.length > 0 ?

                        attachments.map((item) => (

                            <tr key={item.id}>

                                <td>{item.id}</td>

                                <td>

                                    <strong>

                                        {item.file_name}

                                    </strong>

                                </td>

                                <td>

                                    {item.file_type}

                                </td>

                                <td>

                                    {

                                        new Date(
                                            item.uploaded_at
                                        ).toLocaleString()

                                    }

                                </td>

                                <td>

                                    <button
                                        className="view-btn"
                                        onClick={() =>
                                            handleDownload(item.id)
                                        }
                                    >
                                        Download
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            handleDelete(item.id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))

                        :

                        <tr>

                            <td
                                colSpan="5"
                                className="no-data"
                            >
                                No Attachments Found
                            </td>

                        </tr>

                    }

                </tbody>

            </table>

        </div>

    );

}

export default AttachmentTable;