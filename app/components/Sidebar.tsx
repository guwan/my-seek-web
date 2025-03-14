import { Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            {/* 修改外层容器为 fixed 定位 */}
            <div className="fixed inset-0 z-30 flex">
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-linear duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-linear duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    {/* 背景遮罩层 */}
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="transition ease-in-out duration-300 transform"
                    enterFrom="-translate-x-full"
                    enterTo="translate-x-0"
                    leave="transition ease-in-out duration-300 transform"
                    leaveFrom="translate-x-0"
                    leaveTo="-translate-x-full"
                >
                    {/* 侧边栏主体 */}
                    <div className="relative flex-1 flex flex-col w-64 max-w-xs bg-white shadow-xl">
                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <nav className="px-4 space-y-1">
                                <div className="text-gray-900 p-2">Chat History</div>
                                {/* 这里可以添加侧边栏菜单项 */}
                            </nav>
                        </div>
                    </div>
                </Transition.Child>
            </div>
        </Transition.Root>
    );
}