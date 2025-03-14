import { Link } from "react-router-dom";

export default function List() {
    const items = [1, 2, 3, 4, 5];

    return (
        <div>
            <h2>项目列表</h2>
            <ul>
                {items.map(id => (
                    <li key={id}>
                        <Link to={`/detail/${id}`}>项目 #{id}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}