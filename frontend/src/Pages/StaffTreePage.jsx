import { useEffect, useState } from "react";
import { useGetStaff } from "../api/hooks/staff.api";
import LoadingSpinner from "../Components/LoadingSpinner";
import { getImageUrl } from "../utils/imageHelper";
import { Users, X } from "lucide-react";

const StaffTreePage = () => {
    const { getStaff, loading } = useGetStaff();
    const [staffList, setStaffList] = useState([]);
    
    // Modal state
    const [selectedNode, setSelectedNode] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchStaff = async () => {
            const data = await getStaff();
            setStaffList(data);
        };
        fetchStaff();
    }, [getStaff]);

    const buildTree = (nodes, parentId = null) => {
        return nodes
            .filter((node) => node.parentId === parentId)
            .map((node) => ({
                ...node,
                children: buildTree(nodes, node._id),
            }));
    };

    const treeData = buildTree(staffList);

    const handleNodeClick = (node) => {
        setSelectedNode(node);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedNode(null);
    };

    // Organization chart node renderer
    const OrgNode = ({ node }) => {
        return (
            <div className="flex flex-col items-center">
                {/* Node Card */}
                <div 
                    onClick={() => handleNodeClick(node)}
                    className="relative bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-light transition-all rounded-2xl p-4 w-48 z-10 cursor-pointer"
                >
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-gray-100 mb-3 bg-gray-50 flex items-center justify-center">
                        <img 
                            src={getImageUrl(node.image) || "https://placehold.co/100x100?text=User"} 
                            alt={node.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{node.name}</h4>
                        <p className="text-xs font-semibold text-primary">{node.role}</p>
                    </div>
                </div>

                {/* Children */}
                {node.children && node.children.length > 0 && (
                    <div className="relative flex flex-col items-center">
                        {/* Vertical line down from parent */}
                        <div className="w-px h-6 bg-gray-300"></div>
                        
                        {/* Horizontal connecting line for siblings */}
                        <div className="relative flex justify-center w-full">
                            {node.children.length > 1 && (
                                <div 
                                    className="absolute top-0 h-px bg-gray-300"
                                    style={{
                                        left: `calc(50% / ${node.children.length})`,
                                        right: `calc(50% / ${node.children.length})`,
                                        width: `calc(100% - (100% / ${node.children.length}))`
                                    }}
                                ></div>
                            )}

                            {/* Child Nodes */}
                            <div className="flex gap-4 sm:gap-8 justify-center w-full">
                                {node.children.map((child) => (
                                    <div key={child._id} className="relative flex flex-col items-center flex-1">
                                        <div className="w-px h-6 bg-gray-300"></div>
                                        <OrgNode node={child} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-pale text-primary rounded-2xl mb-4">
                        <Users size={24} />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-4">
                        Our Organization
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                        Meet the team behind Zada Pharmacy. We are dedicated to providing you with the best healthcare services.
                    </p>
                </div>

                {/* Tree Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 overflow-x-auto custom-scrollbar">
                    {loading ? (
                        <LoadingSpinner />
                    ) : treeData.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            Organization tree is currently empty.
                        </div>
                    ) : (
                        <div className="flex justify-center min-w-max pb-8">
                            <div className="flex gap-16 justify-center">
                                {treeData.map(rootNode => (
                                    <OrgNode key={rootNode._id} node={rootNode} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Staff Details Modal */}
            {isModalOpen && selectedNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={closeModal}>
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={closeModal} 
                            className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors z-10"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="p-8">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-50 shadow-md mb-4 bg-white">
                                    <img 
                                        src={getImageUrl(selectedNode.image) || "https://placehold.co/100x100?text=User"} 
                                        alt={selectedNode.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">{selectedNode.name}</h3>
                                <p className="text-sm font-bold text-primary mt-1 uppercase tracking-wide">{selectedNode.role}</p>
                            </div>
                            
                            <div className="prose prose-sm prose-blue max-w-none text-gray-600">
                                {selectedNode.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedNode.description }} />
                                ) : (
                                    <p className="text-center text-gray-400 italic">No description available for this team member.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTreePage;
