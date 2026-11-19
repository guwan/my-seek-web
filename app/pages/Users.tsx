import {withProtection} from "~/auth/withProtection";
import {useSelector} from "react-redux";
import type {RootState} from "~/store";
import UserManager from "~/components/Users/UserManager";

function Users() {
    const access = useSelector((state: RootState) => state.currentUserSetter.value.access);
    if (access && access !== "admin") {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                没有访问权限，请联系管理员。
            </div>
        );
    }
    return (
        <div className="h-full overflow-y-auto">
            <UserManager/>
        </div>
    );
}

export default withProtection(Users);
