const Skeleton = ({ className = "", ...props }) => {
    return (
        <div
            className={`motion-safe:animate-pulse motion-reduce:animate-none bg-gray-200 rounded-lg ${className}`}
            {...props}
        />
    );
};

export const ProductCardSkeleton = () => {
    return (
        <div className="flex flex-col h-full bg-white rounded-3xl border-2 border-gray-100 p-3 shadow-sm">
            <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden mb-4">
                <Skeleton className="w-full h-full rounded-2xl" />
            </div>
            <div className="flex flex-col flex-1 px-1.5 pb-1">
                <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-10 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded mb-1" />
                <Skeleton className="h-4 w-3/4 rounded mb-3" />
                <div className="mt-auto flex items-end justify-between">
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
            </div>
        </div>
    );
};

export const ProductGridSkeleton = ({ count = 6 }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
};

export const CategoryCardSkeleton = () => {
    return (
        <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded" />
        </div>
    );
};

export const PageSkeleton = () => {
    return (
        <div className="space-y-6 p-4">
            <Skeleton className="h-8 w-48 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

export const HeroSkeleton = () => {
    return (
        <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] xl:h-[500px] bg-gray-200 motion-safe:animate-pulse motion-reduce:animate-none rounded-none" />
    );
};

export default Skeleton;
