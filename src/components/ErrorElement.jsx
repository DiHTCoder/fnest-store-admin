import React from 'react';
import { useRouteError } from 'react-router-dom';

const ErrorElement = () => {
    const error = useRouteError();
    console.log(error);
    return <h3 className="text-2xl">Có lỗi xảy ra !!!</h3>;
};

export default ErrorElement;
