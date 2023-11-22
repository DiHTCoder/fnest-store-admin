import React, { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { FolderEdit, Trash } from 'lucide-react';
import { FormInput, SubmitButton, Loading } from '../components';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import roomServices from '../services/roomServices';
import { BsSearchHeart } from 'react-icons/bs';
import PreviewImage from '../utils/helpers';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { getAllRoomsSuccess } from '../features/roomSlice';

const RoomsManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const token = useSelector((state) => state.auth.loginAdmin?.token);
    // const data = useSelector((state) => state.room.room?.currentRoom);
    const [data, setData] = useState([]);

    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [idRoom, setIdRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    //Get Rooms
    useEffect(() => {
        if (!token) {
            navigate('/admin/auth/login');
        } else {
            const getCollections = async () => {
                try {
                    const resp = await roomServices.getAllRooms();
                    dispatch(getAllRoomsSuccess(resp.data));
                    setData(resp.data);
                } catch (error) {
                    console.log(error);
                }
            };
            getCollections();
        }
    }, []);

    //Search
    const [filterText, setFilterText] = useState('');
    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

    const filteredItems = data.filter(
        (item) => item.name && item.name.toLowerCase().includes(filterText.toLowerCase()),
    );

    const subHeaderComponentMemo = useMemo(() => {
        const handleClear = () => {
            if (filterText) {
                setResetPaginationToggle(!resetPaginationToggle);
                setFilterText('');
            }
        };

        return (
            <div className="grid grid-cols-2 my-2">
                <div className="relative">
                    <label className="input-group w-full">
                        <input
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            placeholder="Nhập từ khóa tìm kiếm..."
                            className="input input-bordered max-w-xs"
                        />
                        <span className="bg-base-200">
                            <BsSearchHeart className="text-primary" />
                        </span>
                    </label>
                </div>
                <div className="flex items-center mx-5">
                    <button
                        className="btn bg-primary btn-ghost text-white"
                        onClick={() => {
                            setIsUpdateMode(false);
                            document.getElementById('dialog').showModal();
                        }}
                    >
                        + Thêm phòng
                    </button>
                </div>
            </div>
        );
    }, [filterText, resetPaginationToggle]);

    const closeDialog = () => {
        document.getElementById('dialog').close();
    };
    //Reset Form Update and Add new
    const resetForm = () => {
        setIdRoom(null);
        setIsUpdateMode(false);
        formik.resetForm();
    };

    //Update
    const handleUpdate = (id) => {
        setIdRoom(id);
        setIsUpdateMode(true);
        document.getElementById('dialog').showModal();
    };

    // Handle Delete
    const handleDelete = async (id) => {
        setIsLoading(true);
        try {
            const resp = await roomServices.deleteRoom(token, id);
            if (resp.messages && resp.messages.length > 0) {
                setIsLoading(false);
                const updatedData = await roomServices.getAllRooms();
                dispatch(getAllRoomsSuccess(updatedData.data));
                setData(updatedData.data);
                toast.success(resp.messages[0]);
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.messages) {
                const errorMessages = error.response.data.messages;
                setIsLoading(false);
                toast.error(errorMessages.join(', '));
            } else {
                toast.error('Có lỗi xảy ra.');
            }
        }
    };

    // Form submission handler updates and adds new
    const handleSubmit = async (values) => {
        setIsLoading(true);
        closeDialog();
        if (isUpdateMode) {
            if (idRoom) {
                try {
                    const formData = new FormData();
                    formData.append('name', values.name);
                    formData.append('image', values.file);

                    const resp = await roomServices.updateRoom(token, idRoom, formData);
                    if (resp.messages && resp.messages.length > 0) {
                        toast.success(resp.messages[0]);
                        setIsLoading(false);
                        const updatedData = await roomServices.getAllRooms();
                        dispatch(getAllRoomsSuccess(updatedData.data));
                        setData(updatedData.data);
                        resetForm();
                    }
                } catch (error) {
                    if (error.response && error.response.data && error.response.data.messages) {
                        const errorMessages = error.response.data.messages;
                        toast.error(errorMessages.join(', '));
                        setIsLoading(false);
                    } else {
                        toast.error('Có lỗi xảy ra.');
                    }
                }
            }
        } else {
            try {
                const formData = new FormData();
                formData.append('name', values.name);
                formData.append('image', values.file);

                const resp = await roomServices.addRoom(token, formData);
                if (resp.messages && resp.messages.length > 0) {
                    setIsLoading(false);
                    toast.success(resp.messages[0]);
                    const updatedData = await roomServices.getAllRooms();
                    dispatch(getAllRoomsSuccess(updatedData.data));
                    setData(updatedData.data);
                    resetForm();
                }
            } catch (error) {
                if (error.response && error.response.data && error.response.data.messages) {
                    const errorMessages = error.response.data.messages;
                    setIsLoading(false);
                    toast.error(errorMessages.join(', '));
                } else {
                    toast.error('Có lỗi xảy ra.');
                }
            }
        }
    };

    // Form validation using Formik and Yup
    const formik = useFormik({
        initialValues: {
            name: '',
            file: '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Vui lòng nhập thông tin!'),
            file: Yup.mixed().required('Please upload an image'),
        }),
        onSubmit: handleSubmit,
    });

    const columns = [
        {
            name: 'ID',
            selector: (row) => row.id,
            sortable: true,
        },
        {
            name: 'Hình ảnh',
            selector: (row) => <img src={row.image} className="w-14 h-14 my-2"></img>,
            sortable: false,
        },
        {
            name: 'Tên phòng',
            selector: (row) => <div className="text-sm">{row.name}</div>,
            sortable: false,
        },

        {
            name: '',
            cell: (row) => (
                <>
                    <button className="btn btn-outline btn-error mx-2" onClick={() => handleDelete(row.id)}>
                        <Trash />
                    </button>
                    <button
                        className="btn btn-outline btn-success mx-2"
                        onClick={() => {
                            handleUpdate(row.id);
                        }}
                    >
                        <FolderEdit />
                    </button>
                </>
            ),
        },
    ];

    return (
        <div className="mx-20 my-10">
            {isLoading ? <Loading></Loading> : <></>}
            <dialog id="dialog" className="modal">
                <div className="modal-box max-w-2xl">
                    <h3 className="font-bold text-2xl text-center">Danh mục phòng</h3>
                    <form className="my-2" onSubmit={formik.handleSubmit}>
                        <div onClick={closeDialog} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                            X
                        </div>
                        <div className="text-center space-x-10">
                            <div>
                                <FormInput
                                    type="text"
                                    label="Tên Phòng"
                                    name="name"
                                    placeholder="Nhập tên phòng..."
                                    onchange={formik.handleChange}
                                />
                                {formik.errors.name && (
                                    <span className="text-error text-sm p-1 ">{formik.errors.name}</span>
                                )}
                                <FormInput
                                    type="file"
                                    label="Hình ảnh"
                                    name="file"
                                    onchange={(e) => formik.setFieldValue('file', e.target.files[0])}
                                />
                                {formik.values.file && <PreviewImage file={formik.values.file} />}
                                <div className="flex items-center mt-3 text-center justify-center">
                                    <SubmitButton text={isUpdateMode ? 'Cập nhật' : 'Thêm'} />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </dialog>
            <DataTable
                title="QUẢN LÝ DANH MỤC PHÒNG FNEST"
                fixedHeader
                fixedHeaderScrollHeight="550px"
                direction="auto"
                responsive
                pagination
                columns={columns}
                data={filteredItems}
                striped
                subHeader
                paginationResetDefaultPage={resetPaginationToggle}
                subHeaderComponent={subHeaderComponentMemo}
                persistTableHead
                customStyles={{
                    table: {
                        fontSize: '30px',
                    },
                }}
            />
        </div>
    );
};

export default RoomsManagement;
