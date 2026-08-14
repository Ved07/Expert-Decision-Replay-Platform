import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

function DiscussionAttachmentList({ discussionId }) {

    const [attachments, setAttachments] = useState([]);

    const fileInputRef = useRef(null);

    useEffect(() => {

        loadAttachments();

    }, [discussionId]);

    const loadAttachments = async () => {

        try {

            const response = await api.get(
                `/discussion/${discussionId}/attachments`
            );

            setAttachments(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    const handleUpload = async (event) => {

        const file = event.target.files[0];

        if (!file) return;

        const formData = new FormData();

        formData.append("file", file);

        try {

            await api.post(

                `/discussion/${discussionId}/attachments`,

                formData,

                {

                    headers: {

                        "Content-Type": "multipart/form-data",

                    },

                }

            );

            loadAttachments();

        } catch (error) {

            console.error(error);

            alert("Upload failed");

        }

    };

    const handleDownload = (attachment) => {

        window.open(

            `http://127.0.0.1:8000/discussion/${discussionId}/attachments/${attachment.id}`,

            "_blank"

        );

    };

    const handleDelete = async (attachmentId) => {

        if (!window.confirm("Delete this attachment?")) return;

        try {

            await api.delete(

                `/discussion/${discussionId}/attachments/${attachmentId}`

            );

           await loadAttachments();

        } catch (error) {

            console.error(error);

            alert("Delete failed");

        }

    };

    return (

        <div>

            <div className="section-header">

                <h2>Attachments</h2>

                <button
                    className="approve-btn"
                    onClick={() => fileInputRef.current.click()}
                >
                    + Upload Attachment
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleUpload}
                />

            </div>

            <div className="profile-card">

                {

                    attachments.length > 0 ?

                    attachments.map((file) => (

                        <div
                            key={file.id}
                            className="discussion-item"
                        >

                            <h4>{file.filename}</h4>

                            <p>

                                <strong>Uploaded By :</strong>

                                {file.uploaded_by}

                            </p>

                            <small>

                                {

                                    new Date(
                                        file.uploaded_at
                                    ).toLocaleString()

                                }

                            </small>

                            <br /><br />

                            <button
                                className="view-btn"
                                onClick={() => handleDownload(file)}
                            >
                                Download
                            </button>

                            <button
                                className="reject-btn"
                                style={{ marginLeft: "10px" }}
                                onClick={() => handleDelete(file.id)}
                            >
                                Delete
                            </button>

                            <hr />

                        </div>

                    ))

                    :

                    <p>No Attachments Found</p>

                }

            </div>

        </div>

    );

}

export default DiscussionAttachmentList;