import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Edit3,
    Image as ImageIcon,
    Save,
    X,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import {
    useGetHeroSlides,
    useAddHeroSlide,
    useUpdateHeroSlide,
    useDeleteHeroSlide,
} from "../../api/hooks/hero.api.js";
import Input from "../../UI/Input.jsx";
import { handleImageError } from "../../utils/imageHelper";

const HeroManager = () => {
    const { getSlides, slides, loading } = useGetHeroSlides();
    const { addSlide, loading: addLoading } = useAddHeroSlide();
    const { updateSlide, loading: updateLoading } = useUpdateHeroSlide();
    const { deleteSlide } = useDeleteHeroSlide();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
    const [formData, setFormData] = useState({
        order: 0,
        isActive: true,
        isRemoveBg: false,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        getSlides();
    }, [getSlides]);

    const handleEdit = (slide) => {
        setEditingSlide(slide);
        setFormData({
            order: slide.order,
            isActive: slide.isActive,
            isRemoveBg: false,
        });
        setPreviewUrl(`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${slide.image}`);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingSlide(null);
        setFormData({
            order: 0,
            isActive: true,
            isRemoveBg: false,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append("data", JSON.stringify(formData));
        if (selectedFile) {
            data.append("image", selectedFile);
        }

        let res;
        if (editingSlide) {
            res = await updateSlide(editingSlide._id, data);
        } else {
            res = await addSlide(data);
        }

        if (res?.success) {
            handleClose();
            getSlides();
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this slide?")) {
            const res = await deleteSlide(id);
            if (res?.success) {
                getSlides();
            }
        }
    };



    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Active Slides</h3>
                    <p className="text-xs text-gray-500">Manage your carousel slides here</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-primary-dark transition-colors shadow-sm"
                >
                    <Plus size={14} />
                    Add Slide
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200 rounded-lg">
                    <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
                    <p className="text-sm text-gray-500">Loading slides...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {slides.map((slide) => (
                        <div
                            key={slide._id}
                            className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-md transition-all"
                        >
                            <div className={`h-40 relative overflow-hidden bg-gray-100`}>
                                <img
                                    src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${slide.image}`}
                                    alt="Hero Slide"
                                    onError={(e) => handleImageError(e, "carousel")}
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <div className="p-1.5 rounded-lg bg-white/90 border border-gray-200 text-gray-700">
                                        {slide.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </div>
                                    <div className="px-2 py-1 rounded-lg bg-white/90 border border-gray-200 text-gray-700 text-xs font-medium">
                                        #{slide.order}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        onClick={() => handleEdit(slide)}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 hover:text-white transition-all"
                                    >
                                        <Edit3 size={14} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(slide._id)}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-xl relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all z-10"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6 overflow-y-auto max-h-[90vh]">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <ImageIcon className="text-blue-600" size={20} />
                                {editingSlide ? "Edit Slide" : "Add New Slide"}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Image
                                            </label>
                                            <div
                                                onClick={() => document.getElementById("hero-image").click()}
                                                className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all overflow-hidden"
                                            >
                                                {previewUrl ? (
                                                    <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
                                                ) : (
                                                    <>
                                                        <ImageIcon size={32} className="text-gray-300 mb-2" />
                                                        <p className="text-sm text-gray-500">
                                                            Click to upload
                                                        </p>
                                                    </>
                                                )}
                                                <input
                                                    id="hero-image"
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    accept="image/*"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Settings
                                            </label>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isActive}
                                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        Active
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isRemoveBg}
                                                        onChange={(e) => setFormData({ ...formData, isRemoveBg: e.target.checked })}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        Remove Background
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">
                                                Order
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                                className="w-full"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={addLoading || updateLoading}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {(addLoading || updateLoading) ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {editingSlide ? "Update Slide" : "Add Slide"}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroManager;