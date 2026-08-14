import { useEffect, useState } from "react";
import api from "../../services/api";
import VersionHistoryTable from "./VersionHistoryTable";

function VersionHistoryList({ decisionId }) {

    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadVersions();

    }, [decisionId]);

    const loadVersions = async () => {

        try {

            const response = await api.get(
                `/decisions/${decisionId}/versions`
            );

            setVersions(response.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return <h3>Loading Version History...</h3>;

    }

    return (

        <div>

            <VersionHistoryTable
                versions={versions}
            />

        </div>

    );

}

export default VersionHistoryList;