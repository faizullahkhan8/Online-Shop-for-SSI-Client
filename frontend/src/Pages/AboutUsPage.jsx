import { Link } from "react-router-dom";
import { Globe, Mail, MapPin, Phone, Award } from "lucide-react";
import TestAvatar from "../assets/images/avatar.jpg";

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 lg:px-8 py-8">
                <div className="text-center max-w-3xl mx-auto pb-6 border-b border-gray-200">
                    <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-3">
                        About E-Shop
                    </h1>
                    <p className="text-base text-gray-600">
                        Your trusted destination for premium quality products
                        and exceptional service.
                    </p>
                </div>
            </div>

            {/* Admin Section */}
            <section className="py-8 lg:py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="grid lg:grid-cols-2 gap-0">
                            {/* Admin Image */}
                            <div className="bg-gradient-to-br from-blue-50 to-gray-50 p-8 lg:p-10 flex items-center justify-center">
                                <div className="relative">
                                    <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg overflow-hidden">
                                        <img
                                            src={TestAvatar}
                                            alt="Faiz Ullah Khan"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Admin Details */}
                            <div className="p-8 lg:p-10 flex flex-col justify-center">
                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded border border-blue-200 mb-3">
                                        <span className="text-xs font-medium">
                                            Founder & CEO
                                        </span>
                                    </div>
                                    <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-3">
                                        Faiz Ullah Khan
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        A passionate entrepreneur dedicated to
                                        revolutionizing the e-commerce
                                        experience. With a vision to provide
                                        quality products and exceptional
                                        customer service, Faiz founded E-Shop to
                                        create a trusted marketplace for
                                        everyone.
                                    </p>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Mail size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">
                                                Email
                                            </p>
                                            <p className="font-medium text-sm">
                                                faiz@eshop.com
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Phone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">
                                                Phone
                                            </p>
                                            <p className="font-medium text-sm">
                                                +92 300 1234567
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <MapPin size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">
                                                Location
                                            </p>
                                            <p className="font-medium text-sm">
                                                Islamabad, Pakistan
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-8 bg-white border-y border-gray-200">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Our Mission
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                To provide our customers with the best shopping
                                experience by offering high-quality products,
                                competitive prices, and outstanding customer
                                service. We strive to build lasting
                                relationships based on trust and satisfaction.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                Our Vision
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                To become the most trusted and preferred
                                e-commerce platform, known for innovation,
                                reliability, and customer-centric approach. We
                                aim to make online shopping accessible,
                                enjoyable, and rewarding for everyone.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-10 text-white text-center shadow-md">
                        <h2 className="text-2xl lg:text-3xl font-semibold mb-3">
                            Ready to Start Shopping?
                        </h2>
                        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                            Discover our wide range of premium products and
                            enjoy a seamless shopping experience.
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;