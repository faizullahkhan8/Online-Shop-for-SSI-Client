import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import { useEffect } from "react";
import { useGetWishlist } from "../api/hooks/user.api";
import { setWishlist } from "../store/slices/wishlistSlice";
import { useDispatch } from "react-redux";
import { Heart, ArrowRight, ShoppingBag } from "lucide-react";

const WishlistPage = () => {
    const items = useSelector((state) => state.wishlist.items || []);
    const dispatch = useDispatch();
    const { getWishlist } = useGetWishlist();

    useEffect(() => {
        (async () => {
            const resp = await getWishlist();
            if (resp?.wishlist) {
                dispatch(
                    setWishlist(
                        resp.wishlist.map((p) => ({ ...p, id: p._id })),
                    ),
                );
            }
        })();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-8 min-h-[70vh]">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Heart
                                className="text-rose-500"
                                size={20}
                                fill="currentColor"
                            />
                            <span className="text-sm text-gray-500 font-medium">
                                Saved Items
                            </span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
                            My Wishlist
                        </h1>
                    </div>
                    <p className="text-xs font-bold text-[#3E6913] bg-[#EDF6E5] px-4 py-2 rounded-xl border border-[#D5EAC3]">
                        {items.length} {items.length === 1 ? "item" : "items"} saved
                    </p>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white border border-gray-200/80 rounded-2xl py-16 px-6 flex flex-col items-center justify-center shadow-2xs">
                        <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 relative text-rose-500">
                            <Heart size={32} />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-xs border border-gray-200">
                                <ShoppingBag size={12} className="text-[#74AA34]" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Your wishlist is empty
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-xs text-center">
                            Looks like you haven't saved any items yet. Explore our healthcare essentials and save your favorites!
                        </p>
                        <Link
                            to="/products"
                            className="flex items-center gap-2 bg-[#74AA34] hover:bg-[#629329] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                        >
                            Browse Products
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {items.filter(Boolean).map((product, idx) => {
                            const key = product?.id || product?._id || idx;
                            if (!product || (!product.id && !product._id))
                                return null;

                            return (
                                <ProductCard key={key} product={product} />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;