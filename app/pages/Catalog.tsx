import CatalogManager from "~/components/Catalog/CatalogManager";
import {withProtection} from "~/auth/withProtection";

function Catalog() {
    return (
        <div className="h-full overflow-y-auto">
            <CatalogManager />
        </div>
    );
}

export default withProtection(Catalog);
