import {withProtection} from "~/auth/withProtection";
import KnowledgeManager from "~/components/Knowledge/KnowledgeManager";

function Knowledge() {
    return (
        <div className="h-full overflow-y-auto">
            <KnowledgeManager/>
        </div>
    );
}

export default withProtection(Knowledge);
