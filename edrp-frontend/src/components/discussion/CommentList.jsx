import { useEffect, useState } from "react";
import api from "../../services/api";

function CommentList({ discussionId }) {

    const [comments, setComments] = useState([]);

    useEffect(() => {
        loadComments();
    }, [discussionId]);

    const loadComments = async () => {

        try {

            const response = await api.get(
                `/discussion/${discussionId}/comments`
            );

            setComments(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    const handleAddComment = async () => {

        const message = prompt("Enter Comment");

        if (!message) return;

        try {

            await api.post(
                `/discussion/${discussionId}/comments`,
                {
                    message
                }
            );

            loadComments();

        } catch (error) {

            console.error(error);

            alert("Failed to add comment");

        }

    };

    return (

        <div>

            <div className="section-header">

                <h2>Comments</h2>

                <button
                    className="approve-btn"
                    onClick={handleAddComment}
                >
                    + Add Comment
                </button>

            </div>

            <div className="profile-card">

                {

                    comments.length > 0 ?

                    comments.map((comment) => (

                        <div
                            key={comment.id}
                            className="discussion-item"
                        >

                            <h4>User ID : {comment.user_id}</h4>

                            <p>{comment.message}</p>

                            <small>

                                {

                                    new Date(
                                        comment.created_at
                                    ).toLocaleString()

                                }

                            </small>

                            <hr />

                        </div>

                    ))

                    :

                    <p>No Comments Found</p>

                }

            </div>

        </div>

    );

}

export default CommentList;