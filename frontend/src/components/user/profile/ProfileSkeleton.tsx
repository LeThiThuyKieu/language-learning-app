
export default function ProfileSkeleton() {
    return (
        <div className="p-4 space-y-4 animate-pulse">

            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-200"></div>

                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 bg-primary-200 rounded"></div>
                    <div className="h-3 w-1/3 bg-primary-100 rounded"></div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="h-3 w-1/4 bg-primary-100 rounded"></div>
                <div className="h-3 w-2/3 bg-primary-200 rounded"></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 rounded-xl bg-primary-100"></div>
                ))}
            </div>

            <div className="space-y-2">
                <div className="h-3 w-1/3 bg-primary-100 rounded"></div>
                <div className="h-3 w-full bg-primary-200 rounded-full"></div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4,5,6,7,8].map((item) => (
                    <div key={item} className="aspect-square rounded-xl bg-primary-100"></div>
                ))}
            </div>

        </div>
    );
}