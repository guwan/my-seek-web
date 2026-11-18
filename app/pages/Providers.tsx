import {withProtection} from "~/auth/withProtection";
import ProviderManager from "~/components/Providers/ProviderManager";

function Providers() {
    return (
        <div className="h-full overflow-y-auto">
            <ProviderManager/>
        </div>
    );
}

export default withProtection(Providers);
