import {withProtection} from "~/auth/withProtection";
import WritingWorkspace from "~/components/Writing/WritingWorkspace";

function Write() {
    return <WritingWorkspace/>;
}

export default withProtection(Write);
