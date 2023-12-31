import React, { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Loading, TableLoader } from '../components';
import { useNavigate } from 'react-router-dom';
import orderServices from '../services/orderServices';
import { FolderEdit } from 'lucide-react';
import { useSelector } from 'react-redux';
import { formatPrice, formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';

const OrdersManagement = () => {
    const navigate = useNavigate();

    const token = useSelector((state) => state.auth.loginAdmin?.token);
    const user = useSelector((state) => state.auth.loginAdmin?.currentUser);
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState('');
    const [orderStatusCounts, setOrderStatusCounts] = useState({});
    const [pending, setPending] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const filteredOrders = activeTab === 'all' ? data : data.filter((order) => order.status === activeTab);

    useEffect(() => {
        if (!token) {
            navigate('/admin/auth/login');
        } else {
            fetchData();
        }
    }, [token, navigate]);

    const fetchData = async () => {
        try {
            const resp = await orderServices.getAllOrders(token);
            setData(resp.data);

            const countStatusNum = {
                PENDING: 0,
                CONFIRMED: 0,
                IN_SHIPPING: 0,
                COMPLETED: 0,
                REVIEWED: 0,
                CANCELED: 0,
            };

            for (const order of resp.data) {
                const status = order.status;
                countStatusNum[status] += 1;
            }
            setOrderStatusCounts(countStatusNum);
            setPending(false);
        } catch (error) {
            console.log(error);
        }
    };

    const [filterText, setFilterText] = useState('');
    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

    const subHeaderComponentMemo = useMemo(() => {
        return (
            <div className="flex items-center flex-auto">
                <div role="tablist" className="tabs tabs-bordered my-2 border-b-[1px]">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`tab ${activeTab === 'PENDING' ? 'tab-active' : ''}`}
                    >
                        Chờ xác nhận ({orderStatusCounts['PENDING']})
                    </button>
                    <button
                        onClick={() => setActiveTab('CONFIRMED')}
                        className={`tab ${activeTab === 'CONFIRMED' ? 'tab-active' : ''}`}
                    >
                        Đã xác nhận ({orderStatusCounts['CONFIRMED']})
                    </button>
                    <button
                        onClick={() => setActiveTab('IN_SHIPPING')}
                        className={`tab ${activeTab === 'IN_SHIPPING' ? 'tab-active' : ''}`}
                    >
                        Đang giao ({orderStatusCounts['IN_SHIPPING']})
                    </button>
                    <button
                        onClick={() => setActiveTab('COMPLETED')}
                        className={`tab ${activeTab === 'COMPLETED' ? 'tab-active' : ''}`}
                    >
                        Đã giao ({orderStatusCounts['COMPLETED']})
                    </button>
                    <button
                        onClick={() => setActiveTab('REVIEWED')}
                        className={`tab ${activeTab === 'REVIEWED' ? 'tab-active' : ''}`}
                    >
                        Đã hoàn thành ({orderStatusCounts['REVIEWED']})
                    </button>
                    <button
                        onClick={() => setActiveTab('CANCELED')}
                        className={`tab ${activeTab === 'CANCELED' ? 'tab-active' : ''}`}
                    >
                        Đã hủy ({orderStatusCounts['CANCELED']})
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
                    >
                        Tất cả ({data.length})
                    </button>
                </div>
            </div>
        );
    }, [filterText, activeTab, resetPaginationToggle, orderStatusCounts]);
    const sortedOrders = useMemo(() => {
        // Sort the orders by ID in descending order
        return [...filteredOrders].sort((a, b) => b.id - a.id);
    }, [filteredOrders]);
    const closeDialog = () => {
        document.getElementById('dialog').close();
        setIsConfirmationDialogOpen(false);
    };

    const handleUpdateStatus = (id, status) => {
        setSelectedOrder(id);
        setSelectedOrderStatus(status);
        document.getElementById('dialog').showModal();
    };

    const handleStatusUpdate = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        if (user.role === 'STAFF') {
            try {
                const resp = await orderServices.updateOrderStatus(token, selectedOrder, selectedOrderStatus);
                if (resp.status === 'OK') {
                    toast.success('Thay đổi trạng thái thành công!');
                    fetchData();
                    setIsLoading(false);
                    closeDialog();
                }
            } catch (error) {
                setIsLoading(false);
                console.error(error);
            }
        } else {
            setIsLoading(false);
            toast.error('Không có quyền thực hiện!');
        }
    };

    const columns = [
        {
            name: 'ID',
            selector: (row) => row.id,
            sortable: true,
            width: '60px',
        },

        {
            name: 'Ngày tạo',
            selector: (row) => <div className="text-sm">{formatDate(row.createdAt)}</div>,
            sortable: false,
            width: '120px',
        },
        {
            name: 'Ngày cập nhật',
            selector: (row) => <div className="text-sm">{formatDate(row.lastUpdatedAt)}</div>,
            sortable: false,
            width: '120px',
        },
        {
            name: 'Giảm giá',
            selector: (row) => <div className="text-sm">{formatPrice(row.codeDiscount)}</div>,
            sortable: false,
            width: '120px',
        },
        {
            name: 'Trạng thái',
            selector: (row) => <div className="text-sm">{row.status}</div>,
            sortable: false,
            width: '120px',
        },
        {
            name: 'PT Thanh toán',
            selector: (row) => <div className="text-sm">{row.paymentMethod}</div>,
            sortable: false,
            width: '120px',
        },
        {
            name: 'Tổng đơn',
            selector: (row) => <div className="text-sm">{formatPrice(row.total)}</div>,
            sortable: false,
            width: '120px',
        },
        {
            name: 'Phí vận chuyển',
            selector: (row) => <div className="text-sm">{formatPrice(row.shippingCharge)}</div>,
            sortable: false,
            width: '120px',
        },
        {
            name: 'Địa chỉ',
            selector: (row) => <div className="text-sm">{row.deliveryAddress.deliveryAddress}</div>,
            sortable: false,
            width: '150px',
        },
        {
            name: '',
            cell: (row) => (
                <>
                    {user.role === 'STAFF' ? (
                        <button
                            className="btn btn-outline btn-success mx-2"
                            onClick={() => {
                                handleUpdateStatus(row.id, row.status);
                            }}
                        >
                            <FolderEdit />
                        </button>
                    ) : (
                        <></>
                    )}
                </>
            ),
            width: '100px',
        },
    ];
    const ExpandedComponent = ({ data }) => {
        return (
            <div className="mx-20 my-4">
                <div className="grid grid-cols-4 mb-2">
                    <div>
                        <strong>Mã đơn hàng:</strong> {data.id}
                    </div>
                    <div>
                        <strong>Tổng hóa đơn:</strong> {formatPrice(data.total)}
                    </div>
                    <div>
                        <strong>Giảm giá:</strong> {formatPrice(data.codeDiscount)}
                    </div>
                    <div>
                        <strong>Phí vận chuyển:</strong> {formatPrice(data.shippingCharge)}
                    </div>
                </div>
                <div className="mb-2">
                    <strong>Danh sách sản phẩm:</strong>
                    {data.orderItemList.map((item) => (
                        <div className="mb-2 grid grid-cols-7 gap-2">
                            <div className="mb-2">
                                <strong>Tên:</strong> <div className="text-sm">{item.productName}</div>
                            </div>
                            <div className="mb-2">
                                <strong>Kích thước:</strong> <div className="text-sm">{item.productSize}</div>
                            </div>
                            <div className="mb-2">
                                <strong>Vật liệu:</strong> <div className="text-sm">{item.productMaterial}</div>
                            </div>
                            <div className="mb-2">
                                <strong>Hình ảnh:</strong> <img src={item.productThumbnail} className="w-20 h-20" />
                            </div>
                            <div className="mb-2">
                                <strong>Số lượng:</strong> <div className="text-sm">{item.quantity}</div>
                            </div>
                            <div className="mb-2">
                                <strong>Giá SP:</strong> <div className="text-sm">{formatPrice(item.productPrice)}</div>
                            </div>
                            <div className="mb-2">
                                <strong>Tổng:</strong> <div className="text-sm">{formatPrice(item.total)}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <strong>Thông tin nhận hàng</strong>
                    <div className="mb-2">
                        <strong>Người nhận:</strong>{' '}
                        <div className="text-sm">
                            {data.deliveryAddress.receiverName},{data.deliveryAddress.receiverPhone}
                        </div>
                    </div>
                    <div className="mb-2">
                        <strong>Địa chỉ:</strong> <div className="text-sm">{data.deliveryAddress.deliveryAddress}</div>
                    </div>
                    <div className="mb-2">
                        <strong>Phương thức thanh toán:</strong> <div className="text-sm">{data.paymentMethod}</div>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div className="m-10">
            {isLoading ? (
                <Loading />
            ) : (
                <>
                    <dialog id="dialog" className="modal">
                        <div className="modal-box">
                            <form onSubmit={handleStatusUpdate}>
                                <form method="dialog">
                                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                                        ✕
                                    </button>
                                </form>
                                <h3 className="font-bold text-lg text-center uppercase">
                                    Cập nhật trạng thái đơn hàng
                                </h3>
                                <div className="text-center">
                                    <p className="my-10">Bạn muốn cập nhật trạng thái đơn hàng?</p>
                                    <div className="flex items-center mt-3 text-center justify-center">
                                        <button className="btn btn-primary text-white">Xác nhận</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </dialog>
                    <DataTable
                        title="QUẢN LÝ ĐƠN HÀNG FNEST"
                        fixedHeader
                        fixedHeaderScrollHeight="550px"
                        direction="auto"
                        responsive
                        pagination
                        columns={columns}
                        data={sortedOrders}
                        highlightOnHover
                        striped
                        subHeader
                        paginationResetDefaultPage={resetPaginationToggle}
                        subHeaderComponent={subHeaderComponentMemo}
                        persistTableHead
                        progressPending={pending}
                        progressComponent={<TableLoader />}
                        expandableRows
                        expandableRowsComponent={ExpandedComponent}
                        customStyles={{
                            table: {
                                fontSize: '30px',
                            },
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default OrdersManagement;
