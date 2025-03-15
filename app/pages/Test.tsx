// route("products/:pid", "./product.tsx");
import type { Route } from "./+types/Chat";


export async function clientLoader({
                                       params,
                                   }: Route.ClientLoaderArgs) {
    //const res = await fetch(`/api/products/${params.pid}`);
    //const product = await res.json();
    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 100)); // 100 毫秒延迟

    // 模拟的产品数据
    const product = { id: '1', name: 'Product 1' };

    return product;
}
export default function Chat({
                                 loaderData,
                             }: Route.ComponentProps) {
    const {name} = loaderData;
    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow p-4  text-gray-900">
                {name} Chat Messages Here
            </div>
        </div>
    );
}