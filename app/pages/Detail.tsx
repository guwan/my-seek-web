// src/pages/Detail.jsx
import { useParams } from "react-router-dom";

export default function Detail() {
    const { id } = useParams();

    return (
        <div>
            <h2>详情页面</h2>
            <p>正在查看项目 #{id}</p>
        </div>
    );
}