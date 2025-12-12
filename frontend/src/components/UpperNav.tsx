import { ThemeSwitcher } from "@/components/ThemeSwitcher";


const UpperNav = () => {
    return (
        <header className="flex flex-col text-white sm:flex-row justify-between items-center bg-primary dark:bg-primary-dark px-6 py-4 border-b border-gray-700 space-y-4 sm:space-y-0">
            <div className="space-x-2">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                QUICK PRODUCTS
                </button>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                CUSTOM MESSAGES
                </button>
            </div>
            <div className="text-lg font-semibold text-black dark:text-white">Admin@enterprises</div>
            <div className="flex items-center space-x-4">
                <ThemeSwitcher/>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">
                AUDIT LOGS (4)
                </button>
            </div>
        </header>
        
    )
}

export default UpperNav;