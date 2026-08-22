import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import { useEffect } from "react";
import { useGetWishlist } from "../api/hooks/user.api";
import { setWishlist } from "../store/slices/wishlistSlice";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";

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
        <div className="bg-gray-50 min-h-[85vh] py-8 lg:py-12">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Heart className="text-red-500 fill-red-500" size={20} />
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                                Saved Items
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            My Wishlist
                        </h1>
                    </div>
                    <div className="flex items-center">
                        <p className="text-sm font-black text-primary-dark bg-primary-pale px-4 py-2 rounded-xl shadow-sm border border-primary-light/50">
                            {items.length} {items.length === 1 ? "item" : "items"} saved
                        </p>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white border border-gray-100 shadow-sm rounded-3xl py-24 px-6 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 relative">
                            <Heart size={40} className="text-red-400 fill-red-100" />
                            <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                                <ShoppingBag size={14} className="text-primary" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">
                            Your wishlist is empty
                        </h3>
                        <p className="text-gray-500 text-sm mb-8 max-w-sm">
                            Looks like you haven't saved any items yet. Explore our healthcare essentials and save your favorites!
                        </p>
                        <Link
                            to="/products"
                            className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg"
                        >
                            <ArrowLeft size={16} /> Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
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