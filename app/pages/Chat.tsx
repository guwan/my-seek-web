import { AppSidebar } from "~/components/layout/AppSidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "~/components/layout/breadcrumb"
import { Separator } from "~/components/layout/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "~/components/layout/sidebar"
import {withProtection} from "~/auth/withProtection";
import ChatComponent from "~/components/Chat/ChatComponent";

 function Chat() {
    return (
        <ChatComponent />
    )
}
export default withProtection(Chat);