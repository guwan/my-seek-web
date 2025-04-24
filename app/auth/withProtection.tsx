// src/auth/withProtection.tsx
import ProtectedRoute from '../components/ProtectedRoute';

// 高阶组件，用于保护页面
export function withProtection<P extends object>(Component: React.ComponentType<P>) {
    return function ProtectedComponent(props: P) {
        return (
            <ProtectedRoute>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
}