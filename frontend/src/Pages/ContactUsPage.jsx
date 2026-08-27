import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Instagram,
    Twitter,
    Linkedin,
    MapPin,
    Phone,
    Mail,
    ShieldCheck,
    Mailbox,
    Facebook,
} from "lucide-react";

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: "",
        message: "",
    });

    const handleSendEmail = (e) => {
        e.preventDefault();
        const businessEmail = "faizullahofficial0@gmail.com";
        const subject = encodeURIComponent(`Contact Inquiry: ${formData.name}`);
        const body = encodeURIComponent(
            `Name: ${formData.name}\n` +
            `---------------------------\n` +
            `Message:\n${formData.message}`,
        );

        const gmailUrl =
            `https://mail.google.com/mail/?view=cm&fs=1` +
            `&to=${businessEmail}&su=${subject}&body=${body}`;

        window.open(gmailUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <main className="px-6 md:px-12 py-8 max-w-7xl mx-auto">
                <div className="mb-8 pb-4 border-b border-gray-200">
                    <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                        Get In Touch
                    </h1>
                    <p className="text-gray-600 mt-2">We'd love to hear from you</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white p-5 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                                Contact Information
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 group">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 block mb-1">
                                            Location
                                        </span>
                                        <span className="text-sm text-gray-900">
                                            Fazal Shah Mitha Khel Bannu, KP
                                            Pakistan
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 block mb-1">
                                            WhatsApp
                                        </span>
                                        <span className="text-sm text-gray-900">
                                            +92 332 8753452
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 block mb-1">
                                            Email
                                        </span>
                                        <span className="text-sm text-blue-600 break-all">
                                            faizullahofficial0@gmail.com
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-gray-200 bg-gray-900 py-3 px-5 rounded-lg flex justify-between items-center text-white">
                            <span className="text-sm font-medium text-gray-300">
                                Follow Us
                            </span>
                            <div className="flex gap-4">
                                <Instagram
                                    size={18}
                                    className="hover:text-blue-400 cursor-pointer transition-colors"
                                />
                                <Twitter
                                    size={18}
                                    className="hover:text-blue-400 cursor-pointer transition-colors"
                                />
                                <Facebook
                                    size={18}
                                    className="hover:text-blue-400 cursor-pointer transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="bg-white p-5 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Mail className="text-white" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Send us a Message
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        We'll get back to you soon
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSendEmail} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">
                                        Your Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="Enter your full name"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">
                                        Message
                                    </label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                message: e.target.value,
                                            })
                                        }
                                        placeholder="How can we help you?"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    Send via Gmail
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="px-6 md:px-12 py-8 border-t border-gray-200 bg-white mt-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="text-xl font-semibold text-gray-900">
                            Registry
                        </div>
                        <p className="text-xs text-gray-500">
                            © 2024 System Registry. All rights reserved.
                        </p>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-600">
                        <a
                            href="#"
                            className="hover:text-blue-600 transition-colors"
                        >
                            Privacy
                        </a>
                        <a
                            href="#"
                            className="hover:text-blue-600 transition-colors"
                        >
                            Security
                        </a>
                        <a
                            href="#"
                            className="hover:text-blue-600 transition-colors"
                        >
                            Status
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ContactPage;