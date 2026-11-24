import {withProtection} from "~/auth/withProtection";
import TaskManager from "~/components/Task/TaskManager";

function Tasks() {
    return (
        <div className="h-full overflow-y-auto">
            <TaskManager/>
        </div>
    );
}

export default withProtection(Tasks);
