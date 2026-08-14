import { useEffect, useState } from "react";
import api from "../../services/api";

function MeetingNoteList({ discussionId }) {

    const [meetingNotes, setMeetingNotes] = useState([]);

    useEffect(() => {
        loadMeetingNotes();
    }, [discussionId]);

    const loadMeetingNotes = async () => {

        try {

            const response = await api.get(
                `/discussion/${discussionId}/meeting-notes`
            );

            setMeetingNotes(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    const handleAddMeetingNote = async () => {

        const note = prompt("Enter Meeting Note");

        if (!note) return;

        try {

            await api.post(
                `/discussion/${discussionId}/meeting-notes`,
                {
                    note
                }
            );

            await loadMeetingNotes();

        } catch (error) {

            console.error(error);

            alert("Failed to add meeting note");

        }

    };

    return (

        <div>

            <div className="section-header">

                <h2>Meeting Notes</h2>

                <button
                    className="approve-btn"
                    onClick={handleAddMeetingNote}
                >
                    + Add Meeting Note
                </button>

            </div>

            <div className="profile-card">

                {

                    meetingNotes.length > 0 ?

                    meetingNotes.map((item) => (

                        <div
                            key={item.id}
                            className="discussion-item"
                        >

                            <p>{item.note}</p>

                            <p>

                                <strong>Created By :</strong>

                                {item.created_by}

                            </p>

                            <small>

                                {

                                    new Date(
                                        item.created_at
                                    ).toLocaleString()

                                }

                            </small>

                            <hr />

                        </div>

                    ))

                    :

                    <p>No Meeting Notes Found</p>

                }

            </div>

        </div>

    );

}

export default MeetingNoteList;