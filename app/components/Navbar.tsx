// components/Navbar.tsx
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    return (
        <header className="bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
                <button
                    type="button"
                    className="p-2 rounded-md text-gray-700"
                    onClick={onMenuClick}
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>

                <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2">
                        <UserCircleIcon className="h-8 w-8 text-gray-500" />
                        <span className="text-gray-700">Login</span>
                    </button>
                </div>
            </div>
        </header>
    );
}